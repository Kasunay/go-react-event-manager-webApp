package utils

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/mailgun/mailgun-go/v4"
)

func SendEmail(to, subject, plainText, html string) error {
	domain := os.Getenv("MAILGUN_DOMAIN")
	apiKey := os.Getenv("MAILGUN_API_KEY")
	sender := os.Getenv("MAILGUN_SENDER")

	// Default to US region
	apiURL := "https://api.eu.mailgun.net/v3"

	// Create the Mailgun client with the correct region endpoint
	mg := mailgun.NewMailgun(domain, apiKey)

	// Manually set the base URL for Mailgun client
	mg.SetAPIBase(apiURL)

	message := mg.NewMessage(sender, subject, plainText, to)
	message.SetHtml(html)

	// Set a timeout for sending the email
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	// Send the email
	_, _, err := mg.Send(ctx, message)
	if err != nil {
		log.Printf("Failed to send email: %v", err)
	}
	return err
}
