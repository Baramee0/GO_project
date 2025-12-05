package config

import "os"

//GetEnv returns the value of the environment variable or the default value if the variable is not set
func GetEnv(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
