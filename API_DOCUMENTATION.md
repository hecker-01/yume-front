# Yume Ramen Noodles API v1.0.0

API documentation for Yume Ramen Noodles

Base URL: http://localhost:3000/api/v1

## Endpoints

### POST /auth/login
**Summary**: Login a user

**Tags**: Auth

**Request Body**:
- Content-Type: `application/json`

**Responses**:
- **200**: Login successful
- **400**: Missing email or password
- **401**: Invalid credentials
- **500**: Internal server error

---

### POST /auth/refresh
**Summary**: Refresh access token

**Tags**: Auth

**Request Body**:
- Content-Type: `application/json`

**Responses**:
- **200**: New access token generated
- **401**: Refresh token required
- **403**: Invalid or revoked refresh token

---

### POST /auth/logout
**Summary**: Logout user (revoke refresh token)

**Tags**: Auth

**Request Body**:
- Content-Type: `application/json`

**Responses**:
- **200**: Logged out successfully
- **500**: Internal server error

---

### GET /dishes
**Summary**: Returns the list of all dishes

**Tags**: Dishes

**Responses**:
- **200**: The list of the dishes
- **500**: Internal Server Error

---

### POST /dishes
**Summary**: Create a new dish

**Description**: Requires Admin privileges

**Tags**: Dishes

**Request Body**:
- Content-Type: `multipart/form-data`

**Responses**:
- **201**: The dish was successfully created
- **400**: Missing required fields
- **500**: Internal Server Error

---

### GET /dishes/{id}
**Summary**: Get the dish by id

**Tags**: Dishes

**Parameters**:
- `id` (path): The dish id (Required)

**Responses**:
- **200**: The dish description by id
- **404**: The dish was not found
- **500**: Internal Server Error

---

### PUT /dishes/{id}
**Summary**: Update the dish by the id

**Description**: Requires Admin privileges

**Tags**: Dishes

**Parameters**:
- `id` (path): The dish id (Required)

**Request Body**:
- Content-Type: `multipart/form-data`

**Responses**:
- **200**: The dish was updated
- **404**: The dish was not found
- **500**: Internal Server Error

---

### DELETE /dishes/{id}
**Summary**: Remove the dish by id

**Description**: Requires Admin privileges

**Tags**: Dishes

**Parameters**:
- `id` (path): The dish id (Required)

**Responses**:
- **200**: The dish was deleted
- **404**: The dish was not found
- **500**: Internal Server Error

---

### GET /orders
**Summary**: Returns the list of all orders

**Tags**: Orders

**Responses**:
- **200**: The list of the orders
- **500**: Internal Server Error

---

### POST /orders
**Summary**: Create a new order

**Tags**: Orders

**Request Body**:
- Content-Type: `application/json`

**Responses**:
- **201**: The order was successfully created
- **400**: Missing required fields
- **500**: Internal Server Error

---

### GET /orders/{id}
**Summary**: Get the order by id

**Tags**: Orders

**Parameters**:
- `id` (path): The order id (Required)

**Responses**:
- **200**: The order description by id
- **404**: The order was not found
- **500**: Internal Server Error

---

### PUT /orders/{id}
**Summary**: Update the order by the id

**Tags**: Orders

**Parameters**:
- `id` (path): The order id (Required)

**Request Body**:
- Content-Type: `application/json`

**Responses**:
- **200**: The order was updated
- **404**: The order was not found
- **500**: Internal Server Error

---

### DELETE /orders/{id}
**Summary**: Remove the order by id

**Tags**: Orders

**Parameters**:
- `id` (path): The order id (Required)

**Responses**:
- **200**: The order was deleted
- **404**: The order was not found
- **500**: Internal Server Error

---

### GET /users
**Summary**: Returns the list of all users

**Tags**: Users

**Responses**:
- **200**: The list of the users
- **500**: Internal Server Error

---

### POST /users
**Summary**: Create a new user

**Tags**: Users

**Request Body**:
- Content-Type: `application/json`

**Responses**:
- **201**: The user was successfully created
- **400**: Missing required fields
- **500**: Internal Server Error

---

### GET /users/{id}
**Summary**: Get the user by id

**Tags**: Users

**Parameters**:
- `id` (path): The user id (Required)

**Responses**:
- **200**: The user description by id
- **404**: The user was not found
- **500**: Internal Server Error

---

### DELETE /users/{id}
**Summary**: Remove the user by id

**Description**: Requires Owner or Admin privileges

**Tags**: Users

**Parameters**:
- `id` (path): The user id (Required)

**Responses**:
- **200**: The user was deleted
- **404**: The user was not found
- **500**: Internal Server Error

---

### PUT /users/{id}
**Summary**: Update the user by the id

**Description**: Requires Owner or Admin privileges

**Tags**: Users

**Parameters**:
- `id` (path): The user id (Required)

**Request Body**:
- Content-Type: `application/json`

**Responses**:
- **200**: The user was updated
- **404**: The user was not found
- **500**: Internal Server Error

---

