from rest_framework.permissions import BasePermission


class IsSeeker(BasePermission):
    """
    Custom permission to only allow seekers to access a view.
    Requires the user to be authenticated and have 'seeker' role.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has a profile
        if not hasattr(request.user, 'profile'):
            return False
        
        # Check if user role is 'seeker'
        return request.user.profile.role == 'seeker'
    
    message = "You must be a seeker to perform this action."


class IsFacilitator(BasePermission):
    """
    Custom permission to only allow facilitators to access a view.
    Requires the user to be authenticated and have 'facilitator' role.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has a profile
        if not hasattr(request.user, 'profile'):
            return False
        
        # Check if user role is 'facilitator'
        return request.user.profile.role == 'facilitator'
    
    message = "You must be a facilitator to perform this action."


class IsSeekerOrReadOnly(BasePermission):
    """
    Custom permission to allow:
    - Read-only access (GET, HEAD, OPTIONS) to everyone
    - Write access only to seekers
    """
    
    def has_permission(self, request, view):
        # Read-only access for unauthenticated users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write access only for authenticated seekers
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        return request.user.profile.role == 'seeker'


class IsFacilitatorOrReadOnly(BasePermission):
    """
    Custom permission to allow:
    - Read-only access (GET, HEAD, OPTIONS) to everyone
    - Write access only to facilitators
    """
    
    def has_permission(self, request, view):
        # Read-only access for unauthenticated users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write access only for authenticated facilitators
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'profile'):
            return False
        
        return request.user.profile.role == 'facilitator'


class IsOwner(BasePermission):
    """
    Custom permission to allow access only if request.user is the creator/owner of the object.
    All operations (read and write) require ownership.
    
    Requires the object to have a 'created_by' or 'user' attribute.
    """
    
    def has_object_permission(self, request, view, obj):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check ownership
        # Try 'created_by' first (for Event model), then 'user' (for Profile)
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
    
    message = "You must be the owner to perform this action."


class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to allow:
    - Read-only access to everyone
    - Write access only to the owner of the object
    
    Requires the object to have a 'created_by' or 'user' attribute.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read-only permissions are allowed for any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions are only allowed to the owner
        # Try 'created_by' first (for Event model), then 'user' (for Profile)
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
