from rest_framework import generics

from .serializers import IncidentSerializer


class IncidentListCreateView(generics.ListCreateAPIView):
    serializer_class = IncidentSerializer
    pagination_class = None

    def get_queryset(self):
        return self.request.user.incidents.all()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {"results": response.data}
        return response

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
