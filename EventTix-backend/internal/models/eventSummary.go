package models

type EventSummary struct {
	ID              string  `json:"id"`
	Title           string  `json:"title"`
	Slug            string  `json:"slug"`
	Description     *string `json:"description,omitempty"`
	StartTime       string  `json:"start_time"`
	EndTime         *string `json:"end_time,omitempty"`
	LocationName    *string `json:"location_name,omitempty"`
	LocationAddress *string `json:"location_address,omitempty"`
	ImageURL        *string `json:"image_url,omitempty"`

	IsPublished *bool  `json:"is_published"`
	CreatorID   string `json:"creator_id"` // always included for authorization checks

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
