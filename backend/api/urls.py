from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, DriverViewSet, VehicleViewSet, RouteViewSet, TicketViewSet
from .views import report_summary, report_collections, report_daily_chart, transaction_logs, vehicle_records, driver_records, dashboard_stats, public_queue

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'drivers', DriverViewSet)
router.register(r'routes', RouteViewSet)
router.register(r'vehicles', VehicleViewSet)
router.register(r'tickets', TicketViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('report/summary/', report_summary),
    path('report/collections/', report_collections),
    path('report/chart/', report_daily_chart),
    path('logs/', transaction_logs),
    path('vehicles/records/', vehicle_records),
    path('drivers/records/', driver_records),
    path('dashboard/stats/', dashboard_stats),
    path('queue/', public_queue),
]