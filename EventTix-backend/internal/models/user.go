// filepath: c:\Users\sahin\Desktop\TickVibe\EventTix-backend\internal\models\user.go
package models

type SignUpRequest struct {
	FullName string `json:"fullName" validate:"required,min=2,max=100"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
