# urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),  # 루트 경로를 login 뷰로 설정
    path('index/', views.index, name='index'),
    path('nst_mode/', views.nst, name='nst'), 
    path('restore_mode/', views.restore, name='restore'), 
    path('panorama_mode/', views.panorama, name='panorama'), 
    path('sketch_mode/', views.sketch, name='sketch'), 
    path('history/', views.history, name='history'),
    path('receive_token/', views.receive_token, name='receive_token'),
    path('sketchmode_view/', views.sketchmode_view, name='sketchmode_view'),
    path('nst_view/', views.nst_view, name='nst_view'),
    path('panorama_view/', views.panorama_view, name='panorama_view'),
    path('restore_view/', views.restore_view, name='restore_view'),
]