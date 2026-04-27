from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, DriverViewSet, VehicleViewSet, RouteViewSet, TicketViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'drivers', DriverViewSet)
router.register(r'routes', RouteViewSet)
router.register(r'vehicles', VehicleViewSet)
router.register(r'tickets', TicketViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
