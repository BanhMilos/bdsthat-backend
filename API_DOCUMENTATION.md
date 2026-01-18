# BDSTHAT Backend API - Phase 1 Implementation

## Overview
Phase 1 implementation includes core property and listing management features:
- Property CRUD operations
- Listing management with priority/push features
- Media/image uploads
- Document management
- Favorites system

## Base URL
- Development: `http://localhost:3000`
- Production: `https://api.bdsthat.com.vn`

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Property Endpoints

### 1. Create Property
**POST** `/properties`
- **Auth**: Required
- **Body**:
```json
{
  "address": "123 Nguyen Hue, District 1, HCMC",
  "title": "Luxury Apartment in District 1",
  "propertyType": "APARTMENT",
  "description": "Beautiful 2-bedroom apartment...",
  "bedrooms": 2,
  "toilets": 2,
  "floorArea": 80.5,
  "landArea": 80.5,
  "price": 5000000000,
  "direction": "SOUTH",
  "furniture": "FULL",
  "areaPId": 1,
  "areaWId": 10
}
```

### 2. List Properties
**GET** `/properties?page=1&limit=20&propertyType=APARTMENT&bedrooms=2`
- **Auth**: Not required
- **Query Params**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `propertyType`: Filter by property type
  - `bedrooms`: Filter by number of bedrooms
  - `minArea`, `maxArea`: Filter by area range
  - `areaPId`: Filter by province ID
  - `areaWId`: Filter by ward ID

### 3. Get Property Detail
**GET** `/properties/:id`
- **Auth**: Not required

### 4. Update Property
**PUT** `/properties/:id`
- **Auth**: Required
- **Body**: Same as create, all fields optional

### 5. Delete Property
**DELETE** `/properties/:id`
- **Auth**: Required

### 6. Get My Properties
**GET** `/properties/my/properties?page=1&limit=20&status=APPROVED`
- **Auth**: Required

---

## Listing Endpoints

### 1. Create Listing
**POST** `/listings`
- **Auth**: Required
- **Body**:
```json
{
  "propertyId": "123",
  "title": "Beautiful apartment for sale",
  "description": "Lorem ipsum...",
  "price": 5000000000,
  "listingType": "FOR_SALE",
  "priority": 0,
  "currency": "VND"
}
```

### 2. List Listings
**GET** `/listings?page=1&limit=20&listingType=FOR_SALE&priority=2`
- **Auth**: Not required
- **Query Params**:
  - `page`, `limit`: Pagination
  - `listingType`: FOR_SALE or FOR_RENT
  - `propertyType`: Property type filter
  - `minPrice`, `maxPrice`: Price range
  - `bedrooms`: Number of bedrooms
  - `minArea`, `maxArea`: Area range
  - `areaPId`, `areaWId`: Location filters
  - `priority`: 0 (normal), 1 (silver), 2 (gold)
  - `isFeatured`: true/false
  - `search`: Search in title/description/address

### 3. Get Listing Detail
**GET** `/listings/:id`
- **Auth**: Optional (view count only increments for non-owners)

### 4. Update Listing
**PUT** `/listings/:id`
- **Auth**: Required
- **Body**: Same as create, all fields optional

### 5. Delete Listing
**DELETE** `/listings/:id`
- **Auth**: Required

### 6. Push Listing to Top
**POST** `/listings/:id/push`
- **Auth**: Required
- Pushes listing to top of the list by updating `pushedDate`
- Decrements `pushRemain` if not null

### 7. Recreate Listing
**POST** `/listings/:id/recreate`
- **Auth**: Required
- Creates a new listing with same data from expired/old listing

### 8. Get My Listings
**GET** `/listings/my/listings?page=1&limit=20&status=ACTIVE`
- **Auth**: Required

### 9. Get Related Listings
**GET** `/listings/:id/related?limit=10`
- **Auth**: Not required
- Returns listings with same type and property type in same area

### 10. Get User Listings (Public Profile)
**GET** `/listings/user/:userId?page=1&limit=20`
- **Auth**: Not required
- Returns active listings from a specific user with their profile info

### 11. Generate Listing with AI
**POST** `/listings/generate-ai`
- **Auth**: Required
- **Body**:
```json
{
  "propertyId": "123"
}
```
- Returns AI-generated title and description

---

## Media Endpoints

### 1. Upload Media (Multiple Files)
**POST** `/media`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `files[]`: Array of image/video files (max 20)
  - `propertyId`: (optional) Property ID
  - `projectId`: (optional) Project ID
  - `buildingId`: (optional) Building ID
  - `type`: IMAGE, VIDEO, PANORAMA, 3D

### 2. Get Media Detail
**GET** `/media/:id`
- **Auth**: Not required

### 3. Update Media
**PUT** `/media/:id`
- **Auth**: Required
- **Body**:
```json
{
  "order": 1,
  "type": "IMAGE"
}
```

### 4. Delete Media
**DELETE** `/media/:id`
- **Auth**: Required

### 5. Delete Multiple Media
**POST** `/media/delete-multiple`
- **Auth**: Required
- **Body**:
```json
{
  "mediaIds": ["1", "2", "3"]
}
```

---

## Document Endpoints

### 1. Upload Document
**POST** `/documents`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: PDF, DOCX, or image file
  - `title`: Document title
  - `description`: (optional) Document description
  - `propertyId`: (optional) Property ID
  - `projectId`: (optional) Project ID
  - `type`: PDF, DOCX, IMAGE, OTHER
  - `legalType`: SO_HONG, HDMB, OTHER

### 2. Get Document Detail
**GET** `/documents/:id`
- **Auth**: Not required

### 3. Update Document
**PUT** `/documents/:id`
- **Auth**: Required
- **Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "type": "PDF",
  "legalType": "SO_HONG"
}
```

### 4. Delete Document
**DELETE** `/documents/:id`
- **Auth**: Required

---

## Favorite Endpoints

### 1. Like Listing
**POST** `/favorites/like`
- **Auth**: Required
- **Body**:
```json
{
  "listingId": "123"
}
```

### 2. Unlike Listing
**POST** `/favorites/unlike`
- **Auth**: Required
- **Body**:
```json
{
  "listingId": "123"
}
```

### 3. Get My Favorites
**GET** `/favorites/my-favorites?page=1&limit=20&type=LISTING`
- **Auth**: Required

### 4. Check if Listing is Favorited
**GET** `/favorites/check/:listingId`
- **Auth**: Required
- Returns: `{ "isFavorite": true/false }`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Property Types
- `APARTMENT`: Chung cư
- `MINI_APARTMENT`: Chung cư mini
- `HOUSE`: Nhà riêng
- `VILLA`: Biệt thự
- `STREETFRONT`: Nhà mặt phố
- `COMMERCIAL`: Nhà phố thương mại
- `LAND_PROJECT`: Đất nền dự án
- `LAND_SALE`: Đất bán
- `CONDOTEL`: Căn hộ khách sạn
- `WAREHOUSE`: Kho
- `OTHER`: Khác

## Listing Status
- `PENDING`: Chờ duyệt
- `REVIEWING`: Đang duyệt
- `ACTIVE`: Đang hoạt động
- `INACTIVE`: Đã ẩn
- `SOLD`: Đã bán
- `RENTED`: Đã cho thuê
- `EXPIRED`: Hết hạn
- `REJECTED`: Bị từ chối

## Property Status
- `DRAFT`: Nháp
- `PENDING`: Chờ duyệt
- `REVIEWING`: Đang duyệt
- `APPROVED`: Đã duyệt
- `REJECTED`: Bị từ chối

---

## File Upload Limits
- **Images/Videos**: Max 50MB per file
- **Multiple upload**: Max 20 files at once
- **Supported formats**:
  - Images: JPEG, JPG, PNG, GIF, WEBP
  - Videos: MP4, MPEG, QuickTime
  - Documents: PDF, DOC, DOCX

---

## Next Steps (Phase 2+)
- Messaging system (chat rooms, messages)
- Appointment management
- Transaction management
- Projects & Investors
- News system
- Notifications
- Subscriptions & Plans
- Payment integration
- AI search features
