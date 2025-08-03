package models

import (
	"time"
)

type OrderInfo struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	BuyerEmail  string    `json:"buyerEmail"` // Notice camelCase here
	Status      string    `json:"status"`
	TotalAmount int       `json:"totalAmount"` // frontend expects number in cents
	PaymentRef  string    `json:"paymentRef"`
	CreatedAt   time.Time `json:"createdAt"`
}
