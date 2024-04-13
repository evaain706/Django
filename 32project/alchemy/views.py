
from django.shortcuts import render
import json
from django.http import JsonResponse
import cv2
import firebase_admin
from firebase_admin import credentials,storage
from firebase_admin import auth 
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import requests
import base64
from firebase_admin import firestore
import time
from datetime import datetime
import numpy as np 
import os
import tensorflow as tf
import PIL.Image
import tensorflow_hub as hub
from keras.models import Model
from keras.layers import Conv2D, Input, Add, Lambda
import tempfile
from PIL import Image
import io
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
from io import BytesIO




db = firestore.Client()


os.environ['TFHUB_MODEL_LOAD_FORMAT'] = 'COMPRESSED'

def login(request):
    return render(request, 'alchemy/login.html')

def index(request):
    return render(request, 'alchemy/index.html')

def home(request):
   
    return render(request, 'alchemy/index.html')

def nst(request):
    # nst_mode 페이지 
    return render(request, 'alchemy/nst_mode.html')

def restore(request):
    # nst_mode 페이지 
    return render(request, 'alchemy/restore_mode.html')

def panorama(request):
    # nst_mode 페이지 
    return render(request, 'alchemy/panorama_mode.html')

def sketch(request):
    # nst_mode 페이지 
    return render(request, 'alchemy/sketch_mode.html')

def history(request):
    
    return render(request, 'alchemy/history.html')



@csrf_exempt  
def process_and_store_image_sketch(image_data, uid):
    try:
        
        image = base64.b64decode(image_data.split(',')[1])  # base64로 인코딩된 이미지 데이터를 디코딩
        img = cv2.imdecode(np.frombuffer(image, np.uint8), -1)  # OpenCV를 사용하여 이미지 데이터 디코딩
        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # 이미지를 그레이스케일로 변환
        inverted_gray_img = cv2.bitwise_not(gray_img)  # 그레이스케일 이미지를 반전
        blurred_img = cv2.GaussianBlur(inverted_gray_img, (21, 21), 0)  # 가우시안 블러 적용
        inverted_blurred_img = cv2.bitwise_not(blurred_img)  # 블러된 이미지를 반전
        pencil_sketch_img = cv2.divide(gray_img, inverted_blurred_img, scale=256.0)  # 연필 스케치 효과 생성
        
        # 처리된 이미지 배열로부터 Image 객체 생성
        result_image = Image.fromarray(pencil_sketch_img)

        # PNG 형식으로 이미지 데이터를 버퍼에 저장
        buffered = io.BytesIO()
        result_image.save(buffered, format="PNG")
        result_image_data = buffered.getvalue() #이미지가 png형식으로 바이트스트림형태로 저장

        
        bucket = storage.bucket()
       
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
      
        file_name = f'images/{uid}/sketch_{timestamp}.png'
        
        blob = bucket.blob(file_name)
       
        blob.upload_from_file(io.BytesIO(result_image_data))
        
        image_url = blob.public_url
        
        
        return image_url
    except Exception as e:
       
        return f'예외가 발생했습니다: {str(e)}'


@csrf_exempt 
def sketchmode_view(request):
    if request.method == 'POST': 
        data = json.loads(request.body) 
        image_data = data.get('imageData')  
        id_token = data.get('idToken')  

        if image_data and id_token: 
            try:
                decoded_token = auth.verify_id_token(id_token)  
                uid = decoded_token['uid'] 
                print('UID:', uid)

                
                processed_image_url = process_and_store_image_sketch(image_data, uid)
               
                sketchDb(uid, processed_image_url)

               
                return JsonResponse({'message': '이미지를 성공적으로 처리하고 업로드했습니다.', 'processedImageUrl': processed_image_url})
            except auth.InvalidIdTokenError:
              
                return JsonResponse({'error': '유효하지 않은 ID 토큰입니다.'})
            except Exception as e:
               
                return JsonResponse({'error': f'예외가 발생했습니다: {str(e)}'})
        else:
           
            return JsonResponse({'error': '이미지 데이터 또는 토큰을 받지 못했습니다.'})
    else:
      
        return JsonResponse({'error': 'POST 요청이 아닙니다.'})




@csrf_exempt
def sketchDb(user_uid, url):
   
    doc_ref = db.collection(f'users/{user_uid}/images').document() 
    doc_ref.set({ 
        'processedImageUrl': url,
        'timestamp': firestore.SERVER_TIMESTAMP,  
        'mode' : 'sketch',
    })





@csrf_exempt
def receive_token(request):
    if request.method == 'POST':
       
        data = json.loads(request.body)
        id_token = data.get('idToken')

        if id_token:
            try:
               
                decoded_token = auth.verify_id_token(id_token)
                uid = decoded_token.get('uid')
                print('사용자 UID:', uid)
                return JsonResponse({'uid': uid})
            except Exception as e:
                print('토큰 검증 실패:', str(e))
                return JsonResponse({'error': 'ID 토큰을 검증할 수 없습니다.'})
        else:
            return JsonResponse({'error': 'ID 토큰을 받지 못했습니다.'})
    else:
        return JsonResponse({'error': 'POST 요청이 아닙니다.'})
    




@csrf_exempt  
def tensor_to_image(tensor):
    tensor = tensor * 255  # 텐서 값을 0에서 255 사이로 스케일링
    tensor = np.array(tensor, dtype=np.uint8)  # 텐서를 부호 없는 8비트 정수로 변환하여 배열로 만듬
    if np.ndim(tensor) > 3:  # 텐서의 차원이 3보다 큰 경우
        assert tensor.shape[0] == 1  # 첫 번째 차원의 크기가 1이라고 가정
        tensor = tensor[0]  # 첫 번째 차원을 삭제하여 이미지 형태로 변환
    return PIL.Image.fromarray(tensor)  # 넘파이 배열을 이미지로 변환하여 반환





# 모델 중복 다운로드 및 로딩을 막기 위함
loaded_model = None  
hub_model_path = 'C:/models/hub_model/my_model'  # 모델이 저장될 경로

def load_model_if_not_loaded():  
    global loaded_model
    if loaded_model is None:  # 모델이 없을 때만
        if not os.path.exists(hub_model_path):  # 경로에 모델이 없는 경우
            model_url = 'https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2'  # 모델을 다운로드할 URL
            hub_model = hub.load(model_url)  # TensorFlow Hub에서 모델 로드
            tf.saved_model.save(hub_model, hub_model_path)  # 로드한 모델을 지정된 경로에 저장
        loaded_model = tf.saved_model.load(hub_model_path)  # 저장된 모델을 로드






@csrf_exempt
def nst_view(request):
    content_temp_path = None
    style_temp_path = None

    if request.method == 'POST' and request.FILES.get('content_image') and request.FILES.get('style_image') and request.POST.get('uid'):
        try:
            content_image = request.FILES['content_image'] #컨텐츠이미지
            style_image = request.FILES['style_image'] #스타일이미지
            uid = request.POST['uid']  # 사용자 UID 가져오기

            # content_image와 style_image를 임시 파일로 저장(tensorflow 이미지를 효과적으로 처리하기위해)
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as content_temp, tempfile.NamedTemporaryFile(suffix='.png', delete=False) as style_temp:
                for chunk in content_image.chunks():
                    content_temp.write(chunk)# 컨텐츠 이미지를 임시 파일에 쓰기
                for chunk in style_image.chunks():
                    style_temp.write(chunk)# 스타일 이미지를 임시 파일에 쓰기
                    
                  # 임시 파일 경로를 변수에 저장    
                content_temp_path = content_temp.name
                style_temp_path = style_temp.name

          
         
            content_image = tf.io.read_file(content_temp_path)  # 임시 경로에서 컨텐츠 이미지 파일을 읽어옴
            content_image = tf.image.decode_image(content_image, channels=3)  # 채널을 rgb로설정하고 이미지를 TensorFlow가 이해할 수 있는 형식으로 디코딩
            content_image = tf.image.convert_image_dtype(content_image, tf.float32)  # 이미지 데이터 타입을 float32로 변환
            content_image = tf.expand_dims(content_image, axis=0)  # 이미지 차원을 추가하여 배치 형태로 만듬

            style_image = tf.io.read_file(style_temp_path) # 임시 경로에서 스타일 이미지 파일을 읽어옴
            style_image = tf.image.decode_image(style_image, channels=3)# 채널을 rgb로설정하고 이미지를 TensorFlow가 이해할 수 있는 형식으로 디코딩
            style_image = tf.image.convert_image_dtype(style_image, tf.float32) # 이미지 데이터 타입을 float32로 변환
            style_image = tf.expand_dims(style_image, axis=0)   # 이미지 차원을 추가하여 배치 형태로 만듬
            load_model_if_not_loaded() #모델 로드함수 호출
            stylized_image = loaded_model(content_image, style_image)[0]

            # 결과 이미지를 PIL 이미지로 변환 (tensor형식을 다루기쉽게변경)
            result_image = tensor_to_image(stylized_image)

            # PIL 이미지를 BytesIO로 변환(메모리상에서 처리하기위해서)
            buffered = io.BytesIO()
            result_image.save(buffered, format="PNG")
            result_image_data = buffered.getvalue() #이미지를 png형식의 바이트스트림 형태로 저장

            # 임시 파일 삭제
            os.remove(content_temp_path)
            os.remove(style_temp_path)

           
            bucket = storage.bucket() 
            timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
            file_name = f'images/{uid}/nst_image_{timestamp}.png'
            blob = bucket.blob(file_name)
            blob.upload_from_file(io.BytesIO(result_image_data))
            image_url = blob.public_url 

           
            doc_ref = db.collection(f'users/{uid}/images').document() 
            doc_ref.set({
                'processedImageUrl': image_url,
                'timestamp': firestore.SERVER_TIMESTAMP,  
                'mode' : 'nst',
                })

            return JsonResponse({'resultImageUrl': image_url, 'uid': uid})  
        except Exception as e:
            if content_temp_path:
                os.remove(content_temp_path)
            if style_temp_path:
                os.remove(style_temp_path)
            return JsonResponse({'error': str(e)})
    else:
        return JsonResponse({'error': 'Invalid request method or no image uploaded'})
    



#후처리코드
@csrf_exempt  
def process_image(stitched):
    # 입력된 이미지를 흑백으로 변환
    gray = cv2.cvtColor(stitched, cv2.COLOR_BGR2GRAY)
    # 이진화를 수행하여 이미지를 반전
    thresh = cv2.bitwise_not(cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY)[1])
    # 이미지를 중앙값필터를 사용해 블러 처리
    thresh = cv2.medianBlur(thresh, 5)

    # 입력 이미지와 이진화된 이미지의 복사본 만들기
    stitched_copy = stitched.copy()
    thresh_copy = thresh.copy()

    # 이진화된 이미지의 합이 0보다 큰 경우에만 반복
    while np.sum(thresh_copy) > 0:
        # 이미지 크기 1씩 줄이기.
        thresh_copy = thresh_copy[1:-1, 1:-1]
        stitched_copy = stitched_copy[1:-1, 1:-1]

    # 이미지처리가 완료된 이미지를 반환
    return stitched_copy





@csrf_exempt
def panorama_view(request):
    if request.method == 'POST':
        try:
            uid = request.POST.get('uid')  
            images = request.FILES.getlist('images') #이미지 배열 받아옴
            print('Received UID:', uid)  

            img_array = []# 이미지 배열 초기화

            # 이미지 목록을 돌면서 각 이미지를 읽고 배열애 추가하기
            for image in images:
                nparr = np.frombuffer(image.read(), np.uint8)  # 이미지파일을 바이트배열로 읽기
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)   # 바이트배열을 이미지로 디코딩
                img_array.append(img)  # 디코딩된 이미지를 배열에 추가

           # 스티칭 모드를 설정하고 스티처 객체를 생성합니다.
            mode = cv2.STITCHER_PANORAMA# 파노라마 스티칭 모드를 설정
            stitcher = cv2.createStitcher(mode) if int(cv2.__version__[0]) == 3 else cv2.Stitcher_create(mode)
            status, stitched = stitcher.stitch(img_array)# 이미지배열을 사용해 이미지를 스티칭

            if status == 0:#스티칭 성공시
                processed_image = process_image(stitched)  # 이미지 후처리

                # 이미지를 BytesIO로 변환
                _, result_image_data = cv2.imencode('.png', processed_image)
                
               
                bucket = storage.bucket()  
                timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
                file_name = f'images/{uid}/panorama_image_{timestamp}.png'
                blob = bucket.blob(file_name)
                blob.upload_from_file(io.BytesIO(result_image_data))
                image_url = blob.public_url
                doc_ref = db.collection(f'users/{uid}/images').document()
                doc_ref.set({ 
                    'processedImageUrl': image_url,
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'mode': '파노라마',
                })

                return JsonResponse({'resultImageUrl': image_url, 'uid': uid})
            else:
                return JsonResponse({'message': 'Image stitching failed'})
        except Exception as e:
            return JsonResponse({'message': f'Error: {e}'})
    return JsonResponse({'message': 'Invalid request'})





@csrf_exempt
def restore_view(request):
    if request.method == 'POST' and request.FILES.get('content_image') and request.POST.get('uid'): #이미지와 uid를 받아옴
        try:
            uid = request.POST.get('uid') 
            origin_image = request.FILES['content_image'] # 원본이미지
            @csrf_exempt
            def ResBlock(input_layer, filters):

                #  첫번째 컨볼루션 레이어 -> 입력 레이어로부터 컨볼루션 연산을 수행
                x = Conv2D(filters=filters, kernel_size=3, padding='same', activation='relu')(input_layer)

                # 두 번째 컨볼루션 레이어 -> 활성화 함수를 사용하지 않고 컨볼루션 연산 수행
                x = Conv2D(filters=filters, kernel_size=3, padding='same')(x)

                #입력 레이어와 두 번째 컨볼루션 레이어의 출력 더하기
                x = Add()([input_layer, x])

                return x# 최종적으로 변환된 값을 반환
            
            @csrf_exempt
            def InterConnected(input_shape):
              
                input_tensor = Input(shape=input_shape) #입력텐서 생성

                # 첫 번째 컨볼루션 레이어 추가
                x = Conv2D(filters=32, kernel_size=3, padding='same', activation='relu')(input_tensor) 

                for i in range(2):# ResBlock을 2번 반복적용
                    x = ResBlock(x, 32) # ResBlock을 적용

                x = Conv2D(filters=32*9, kernel_size=3, padding='same')(x) # 컨볼루션 레이어를 추가

                x = Lambda(lambda x: tf.nn.depth_to_space(x, block_size=3))(x) # 텐서플로우의 depth_to_space 함수를 사용하여 텐서를 변경

                output_tensor = Conv2D(filters=3, kernel_size=1)(x)# 마지막 컨볼루션 레이어를 추가하여 출력 텐서 만들기

                model = Model(inputs=input_tensor, outputs=output_tensor) # 입력과 출력을 지정하여 모델 정의

                print(model.summary()) # 모델구조 출력
                return model #모델반환

            # 모델 정의 및 로드
            model = InterConnected((170, 170, 3))  # 모델 아키텍처 정의
            model.load_weights('resblock1_2_32_20(3).h5')  # 모델 가중치 로드

            # 이미지 처리
            img = Image.open(origin_image) #이미지 파일열기
            img = img.resize((170, 170))  # 이미지 크기를 170x170 픽셀로 조정
            arr = np.array(img) #이미지를 넘파이배열로 변환
            pred = model.predict(arr.reshape(1, 170, 170, 3)) #모델을 사용하여 예측수행
            pred = pred.astype(np.uint8) #예측값을 8비트 부호없는 정수로 변환
            output_image = Image.fromarray(pred[0]) #예측결과를 이미지로 변환

            buffered = io.BytesIO() # 이미지를 메모리상에서 처리하고 업로드할수있게 하기위해 바이트데이터로 변환(파일로 저장하지않고 메모리상에서 직접 처리,전송가능)
            output_image.save(buffered, format="PNG")
            output_image_data = buffered.getvalue() #이미지를 png형식의 바이트스트림형태로 저장

            bucket = storage.bucket() 
            timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
            file_name = f'images/{uid}/nst_image_{timestamp}.png'
            blob = bucket.blob(file_name)
            blob.upload_from_file(io.BytesIO(output_image_data))
            image_url = blob.public_url

            
            
            doc_ref = db.collection(f'users/{uid}/images').document()
            doc_ref.set({ 
                    'processedImageUrl': image_url,
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'mode': '이미지복원',
                })
            return JsonResponse({'resultImageUrl': image_url}) 

        except Exception as e:
            return JsonResponse({'error': str(e)})

    return JsonResponse({'error': 'Image not processed'})



