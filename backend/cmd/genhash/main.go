// Утилита для генерации bcrypt-хеша пароля
// Запуск: go run ./cmd/genhash <пароль>
// Пример: go run ./cmd/genhash admin123
package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Использование: go run ./cmd/genhash <пароль>")
		os.Exit(1)
	}

	password := os.Args[1]
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Ошибка: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(hash))
}
