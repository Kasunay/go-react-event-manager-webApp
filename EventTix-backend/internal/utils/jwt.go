package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte(os.Getenv("JWT_SECRET"))

type Claims struct {
	UserID          string `json:"userId"`
	FullName        string `json:"fullName"`
	Role            string `json:"role"`
	Email           string `json:"email"`
	IsEmailVerified bool   `json:"isEmailVerified"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID string, role string, email string, isEmailVerified bool, fullName string) (string, error) {
	expirationTime := time.Now().Add(1 * time.Hour)

	claims := &Claims{
		UserID:          userID,
		FullName:        fullName,
		Role:            role,
		Email:           email,
		IsEmailVerified: isEmailVerified,

		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ParseJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	//fmt.Print(claims)
	/*fmt.Print(token) */
	return claims, nil
}
