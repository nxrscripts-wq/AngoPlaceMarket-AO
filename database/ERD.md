
# AngoPlaceMarket (APM) - Entity Relationship Model

## Core Modules

### 1. Identity & Access (IAM)
- **Users** (1:N) **Addresses**
- **Users** (1:1) **Sellers**
- **Roles** (1:N) **Users**

### 2. Catalog Management
- **Sellers** (1:N) **Products**
- **Categories** (1:N) **Products** (Self-referencing parent_id for categories)
- **Products** (1:N) **ProductImages**
- **Products** (1:1) **Inventory**

### 3. Sales Flow
- **Users** (1:N) **Orders**
- **Orders** (1:N) **OrderItems**
- **Products** (1:N) **OrderItems**
- **Orders** (1:1) **Payments**

### 4. Logistics & Post-Sales
- **Orders** (1:1) **Shipments**
- **Shipments** (1:N) **TrackingUpdates**
- **Users** (1:N) **Reviews**
- **Products** (1:N) **Reviews**

## Database Diagram (Simplified ASCII)
```text
[Roles] ---< [Users] ---< [Addresses]
               |
               +---1:1--- [Sellers] ---< [Products] >--- [Categories]
                                            |   |
                                            |   +---< [ProductImages]
                                            |   +---1:1--- [Inventory]
                                            |
[Orders] ---< [OrderItems] >----------------+
   |
   +---1:1--- [Payments]
   |
   +---1:1--- [Shipments] ---< [TrackingUpdates]
```
