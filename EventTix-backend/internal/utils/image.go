package utils

import (
	"bytes"
	"encoding/base64"
	"errors"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
)

func DecodeAndValidateBase64Image(encoded string) ([]byte, error) {
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, errors.New("invalid base64 image data")
	}

	_, _, err = image.DecodeConfig(bytes.NewReader(decoded))
	if err != nil {
		return nil, errors.New("decoded data is not a valid image")
	}

	return decoded, nil
}

func SaveImage(decodedImage []byte, folderPath, fileName string) (string, error) {
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		return "", errors.New("failed to create image folder: " + err.Error())
	}

	fullPath := filepath.Join(folderPath, fileName)
	if err := os.WriteFile(fullPath, decodedImage, 0644); err != nil {
		return "", errors.New("failed to save image file: " + err.Error())
	}

	return fullPath, nil
}
