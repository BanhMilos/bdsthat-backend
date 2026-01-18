    -- ============================================
-- BDSTHAT Database Schema - CamelCase Version
-- All column names quoted to preserve camelCase
-- Generated from: Tài liệu ERD.md
-- Date: 2026-01-18
-- ============================================

-- ENUMS (same as before)
CREATE TYPE user_primary_role AS ENUM ('USER','AGENT','ADMIN');
CREATE TYPE user_status AS ENUM ('REGISTERED','ACTIVE','BANNED','DELETED');
CREATE TYPE user_idcard_type AS ENUM ('CC','PASSPORT');
CREATE TYPE user_agent_status AS ENUM ('PENDING','VERIFIED');

CREATE TYPE property_type AS ENUM ('APARTMENT','MINI_APARTMENT','HOUSE','VILLA','STREETFRONT','COMMERCIAL','LAND_PROJECT','LAND_SALE','CONDOTEL','WAREHOUSE','OTHER');
CREATE TYPE property_status AS ENUM ('DRAFT','PENDING','REVIEWING','APPROVED','REJECTED');
CREATE TYPE property_direction AS ENUM ('NORTH','SOUTH','EAST','WEST','NORTHEAST','SOUTHEAST','NORTHWEST','SOUTHWEST');
CREATE TYPE property_legal_document_type AS ENUM ('SO_HONG','HDMB','OTHER');
CREATE TYPE property_legal_status AS ENUM ('LEGAL','PLANNING_ISSUES','UNDETERMINED','REVOKED','NON_EXISTENT');
CREATE TYPE property_furniture AS ENUM ('BASIC','FULL','NONE');
CREATE TYPE property_usage_status AS ENUM ('OWNER_OCCUPIED','FOR_RENT','RENTED');

CREATE TYPE listing_type AS ENUM ('FOR_SALE','FOR_RENT');
CREATE TYPE listing_status AS ENUM ('PENDING','REVIEWING','ACTIVE','INACTIVE','SOLD','RENTED','EXPIRED','REJECTED');
CREATE TYPE listing_credit_source AS ENUM ('PAYMENT','WALLET','SUBSCRIPTION');

CREATE TYPE appointment_status AS ENUM ('PENDING','CONFIRMED','CANCELLED','COMPLETED');
CREATE TYPE transaction_status AS ENUM ('OFFERED','ACCEPTED','COMPLETED','CANCELLED');
CREATE TYPE area_type AS ENUM ('C','P','D','W');
CREATE TYPE document_type AS ENUM ('PDF','DOCX','IMAGE','OTHER');
CREATE TYPE document_legal_type AS ENUM ('SO_HONG','HDMB','OTHER');
CREATE TYPE media_type AS ENUM ('IMAGE','VIDEO','3D','PANORAMA');
CREATE TYPE message_type AS ENUM ('TEXT','IMAGE','VIDEO','FILE');
CREATE TYPE utility_type AS ENUM ('AMENITY','SERVICE','FACILITY');
CREATE TYPE plan_status AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE subscription_status AS ENUM ('ACTIVE','EXPIRED','CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING','COMPLETED','FAILED');
CREATE TYPE payment_method AS ENUM ('CASH','VNPAY','MOMO','QR');
CREATE TYPE payment_for AS ENUM ('SUBSCRIPTION','LISTING','TOPUP');
CREATE TYPE audit_action AS ENUM ('CREATE','UPDATE','DELETE');
CREATE TYPE news_status AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
CREATE TYPE notification_type AS ENUM ('NEWS','SYSTEM','PROMOTION','TRANSACTION','APPOINTMENT','LISTING','PROJECT','PROPERTY');
CREATE TYPE lead_status AS ENUM ('NEW','CONTACTED','QUALIFIED','LOST');
CREATE TYPE otp_channel AS ENUM ('SMS','EMAIL','ZALO');
CREATE TYPE otp_purpose AS ENUM ('REGISTER','LOGIN','TRANSACTION','CHANGE_PASSWORD');
CREATE TYPE suggestion_type AS ENUM ('PROPERTY','LISTING','PROJECT','AREA','NEWS','OTHER');
CREATE TYPE comment_status AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE faq_category AS ENUM ('PLAN','PROJECT','PAYMENT','ACCOUNT');
CREATE TYPE faq_status AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE project_status AS ENUM ('UPDATING','OPENNING','COMPLETED');
CREATE TYPE project_type AS ENUM ('APARTMENT','OFFICE','MALL','NEW_URBAN','COMPLEX','SOCIAL_HOUSING','RESORT','INDUSTRIAL_PARK','TOWN_HOUSE','SHOPHOUSE','STREETFRONT','OTHER');
CREATE TYPE favorite_type AS ENUM ('PROPERTY','LISTING','NEWS');
CREATE TYPE member_status AS ENUM ('INVITED','JOINED','REQUESTED','BLOCKED');

-- ============================================
-- TABLES WITH QUOTED CAMELCASE COLUMNS
-- ============================================

CREATE TABLE "User" (
  "userId" BIGSERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "fullname" VARCHAR(255),
  "phone" VARCHAR(20),
  "address" TEXT,
  "idCardNumber" VARCHAR(50),
  "idCardType" user_idcard_type,
  "primaryRole" user_primary_role,
  "status" user_status,
  "ekycVerified" INT DEFAULT 0,
  "token" VARCHAR(1024),
  "expirationDate" TIMESTAMPTZ,
  "resetPasswordOTP" VARCHAR(1024),
  "resetPasswordOTPExpirationDate" TIMESTAMPTZ,
  "lastActive" TIMESTAMPTZ DEFAULT NOW(),
  "agentCertificate" TEXT,
  "agentStatus" user_agent_status DEFAULT 'PENDING',
  "idCardDocuments" JSONB,
  "avatar" TEXT,
  "idCardPlaceIfIssue" VARCHAR(256),
  "idCardIssueDate" TIMESTAMPTZ,
  "balance" DOUBLE PRECISION,
  "lifetimeBalance" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Area" (
  "areaId" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "type" area_type NOT NULL,
  "parentId" BIGINT REFERENCES "Area"("areaId"),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "isOldArea" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Investor" (
  "investorId" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "address" VARCHAR(255),
  "phone" VARCHAR(20),
  "email" VARCHAR(255),
  "website" VARCHAR(255),
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Project" (
  "projectId" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "investorId" BIGINT REFERENCES "Investor"("investorId"),
  "scale" DECIMAL(10,2),
  "density" VARCHAR(100),
  "numBlocks" INT,
  "description" TEXT,
  "startDate" DATE,
  "endDate" DATE,
  "status" project_status DEFAULT 'UPDATING',
  "projectType" project_type,
  "primaryMediaId" BIGINT,
  "areaPId" INT,
  "areaWId" INT,
  "oldAreaPId" INT,
  "oldAreaDId" INT,
  "oldAreaWId" INT,
  "premiseImage" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Subdivision" (
  "subdivisionId" BIGSERIAL PRIMARY KEY,
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Building" (
  "buildingId" BIGSERIAL PRIMARY KEY,
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "subdivisionId" BIGINT REFERENCES "Subdivision"("subdivisionId"),
  "name" VARCHAR(255) NOT NULL,
  "address" VARCHAR(255),
  "numFloors" INT,
  "numUnits" INT,
  "approximateArea" DECIMAL(10,2),
  "unitsPerFloor" INT,
  "numBasements" INT,
  "description" TEXT,
  "images" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Property" (
  "propertyId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "authorizedUserId" BIGINT REFERENCES "User"("userId"),
  "authorizedAgentId" BIGINT REFERENCES "User"("userId"),
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "buildingId" BIGINT REFERENCES "Building"("buildingId"),
  "subdivisionId" BIGINT REFERENCES "Subdivision"("subdivisionId"),
  "address" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "floor" INT,
  "unit" VARCHAR(64),
  "description" TEXT,
  "propertyType" property_type,
  "width" DECIMAL(5,2),
  "length" DECIMAL(5,2),
  "floors" INT,
  "floorArea" DECIMAL(10,2),
  "buildingArea" DECIMAL(10,2),
  "landArea" DECIMAL(10,2),
  "bedrooms" INT,
  "toilets" INT,
  "status" property_status,
  "direction" property_direction,
  "legalDocumentType" property_legal_document_type,
  "legalDocumentNumber" VARCHAR(64),
  "legalStatus" property_legal_status,
  "latitude" DECIMAL(10,8),
  "longitude" DECIMAL(11,8),
  "furniture" property_furniture,
  "streetWidth" DECIMAL(5,2),
  "primaryMediaId" BIGINT,
  "usageStatus" property_usage_status DEFAULT 'OWNER_OCCUPIED',
  "areaPId" INT,
  "areaWId" INT,
  "oldAreaPId" INT,
  "oldAreaDId" INT,
  "oldAreaWId" INT,
  "panoramaConfig" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Listing" (
  "listingId" BIGSERIAL PRIMARY KEY,
  "propertyId" BIGINT REFERENCES "Property"("propertyId") NOT NULL,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "price" DECIMAL(15,2) NOT NULL,
  "listingType" listing_type,
  "status" listing_status DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "verified" INT DEFAULT 0,
  "expirationDate" TIMESTAMPTZ,
  "currency" VARCHAR(10) DEFAULT 'VND',
  "listingMessages" JSONB,
  "isFeatured" INT DEFAULT 0 NOT NULL,
  "views" INT DEFAULT 0,
  "priority" INT NOT NULL,
  "pushedDate" TIMESTAMPTZ NOT NULL,
  "creditSource" listing_credit_source,
  "pushCount" INT DEFAULT 0 NOT NULL,
  "pushRemain" INT DEFAULT 0,
  "titleAI" VARCHAR(255),
  "descriptionAI" TEXT
);

CREATE TABLE "Utility" (
  "utilityId" BIGSERIAL PRIMARY KEY,
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "name" VARCHAR(255) NOT NULL,
  "type" utility_type,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Media" (
  "mediaId" BIGSERIAL PRIMARY KEY,
  "propertyId" BIGINT REFERENCES "Property"("propertyId"),
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "buildingId" BIGINT REFERENCES "Building"("buildingId"),
  "subdivisionId" BIGINT REFERENCES "Subdivision"("subdivisionId"),
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "type" media_type NOT NULL,
  "url" VARCHAR(500) NOT NULL,
  "path" VARCHAR(500),
  "order" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Document" (
  "documentId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "propertyId" BIGINT REFERENCES "Property"("propertyId"),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "url" VARCHAR(500) NOT NULL,
  "path" VARCHAR(500),
  "type" document_type,
  "legalType" document_legal_type,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Panorama" (
  "panoramaId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "propertyId" BIGINT REFERENCES "Property"("propertyId"),
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "buildingId" BIGINT REFERENCES "Building"("buildingId"),
  "subdivisionId" BIGINT REFERENCES "Subdivision"("subdivisionId"),
  "baseUrl" VARCHAR(1024),
  "basePath" VARCHAR(2048),
  "order" INT DEFAULT 0,
  "location" VARCHAR(1024),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Appointment" (
  "appointmentId" BIGSERIAL PRIMARY KEY,
  "propertyId" BIGINT REFERENCES "Property"("propertyId") NOT NULL,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "listingId" BIGINT REFERENCES "Listing"("listingId") NOT NULL,
  "status" appointment_status DEFAULT 'PENDING',
  "datetime" TIMESTAMPTZ NOT NULL,
  "description" TEXT,
  "cancelReason" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Transaction" (
  "transactionId" BIGSERIAL PRIMARY KEY,
  "listingId" BIGINT REFERENCES "Listing"("listingId") NOT NULL,
  "propertyId" BIGINT REFERENCES "Property"("propertyId") NOT NULL,
  "agentId" BIGINT REFERENCES "User"("userId"),
  "sellerId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "guestId" BIGINT REFERENCES "User"("userId"),
  "transactionDate" TIMESTAMPTZ NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "status" transaction_status DEFAULT 'OFFERED',
  "effectiveDate" TIMESTAMPTZ,
  "expirationDate" TIMESTAMPTZ,
  "contractDocument" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Favorite" (
  "favoriteId" BIGSERIAL PRIMARY KEY,
  "type" favorite_type DEFAULT 'LISTING',
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "propertyId" BIGINT REFERENCES "Property"("propertyId"),
  "listingId" BIGINT REFERENCES "Listing"("listingId"),
  "newsId" BIGINT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Feedback" (
  "feedbackId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "content" TEXT NOT NULL,
  "rating" INT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "PriceHistory" (
  "priceHistoryId" BIGSERIAL PRIMARY KEY,
  "propertyId" BIGINT REFERENCES "Property"("propertyId") NOT NULL,
  "price" DECIMAL(15,2) NOT NULL,
  "changeDate" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "ChatRoom" (
  "roomId" BIGSERIAL PRIMARY KEY,
  "listingId" BIGINT REFERENCES "Listing"("listingId"),
  "isActive" BOOLEAN DEFAULT TRUE,
  "membersCount" INT DEFAULT 0,
  "lastMessageId" BIGINT,
  "lastMessageAt" TIMESTAMPTZ,
  "createdBy" BIGINT REFERENCES "User"("userId") NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Member" (
  "memberId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "roomId" BIGINT REFERENCES "ChatRoom"("roomId") NOT NULL,
  "role" VARCHAR(256),
  "status" member_status,
  "notification" INT DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Message" (
  "messageId" BIGSERIAL PRIMARY KEY,
  "roomId" BIGINT REFERENCES "ChatRoom"("roomId") NOT NULL,
  "senderId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "content" TEXT NOT NULL,
  "messageType" message_type DEFAULT 'TEXT',
  "isRead" BOOLEAN DEFAULT FALSE,
  "media" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Device" (
  "deviceId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "uuid" VARCHAR(256) NOT NULL,
  "platform" VARCHAR(256),
  "platformToken" VARCHAR(2048),
  "online" INT DEFAULT 0,
  "granted" INT DEFAULT 0,
  "ipAddress" VARCHAR(256),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Plan" (
  "planId" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "durationDays" INT NOT NULL,
  "maxListings" INT NOT NULL DEFAULT 1,
  "featuredListings" INT DEFAULT 0,
  "prioritySupport" BOOLEAN DEFAULT FALSE NOT NULL,
  "status" plan_status DEFAULT 'ACTIVE' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Subscription" (
  "subscriptionId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "planId" BIGINT REFERENCES "Plan"("planId") NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "status" subscription_status DEFAULT 'ACTIVE',
  "paymentStatus" payment_status DEFAULT 'PENDING',
  "goldListingUsed" INT DEFAULT 0 NOT NULL,
  "silverListingUsed" INT DEFAULT 0 NOT NULL,
  "normalListingUsed" INT DEFAULT 0 NOT NULL,
  "pushCountUsed" INT DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Payment" (
  "paymentId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "subscriptionId" BIGINT REFERENCES "Subscription"("subscriptionId"),
  "listingId" BIGINT REFERENCES "Listing"("listingId"),
  "walletTransactionId" BIGINT,
  "amount" DOUBLE PRECISION NOT NULL,
  "amountBeforeTax" DOUBLE PRECISION,
  "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "paymentMethod" payment_method NOT NULL,
  "paymentStatus" payment_status DEFAULT 'PENDING',
  "paymentFor" payment_for,
  "description" TEXT,
  "time" TIMESTAMPTZ NOT NULL,
  "paymentLink" TEXT,
  "qrCode" TEXT,
  "externalTransactionId" VARCHAR(1024),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "WalletTransaction" (
  "transactionId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "endingBalance" DOUBLE PRECISION NOT NULL,
  "paymentMethod" payment_method NOT NULL,
  "status" payment_status DEFAULT 'PENDING',
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Category" (
  "categoryId" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "parentId" BIGINT REFERENCES "Category"("categoryId"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "News" (
  "newsId" BIGSERIAL PRIMARY KEY,
  "categoryId" BIGINT REFERENCES "Category"("categoryId") NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "userId" BIGINT REFERENCES "User"("userId"),
  "publishedDate" TIMESTAMPTZ,
  "status" news_status,
  "author" VARCHAR(100),
  "sourceUrl" VARCHAR(2048),
  "source" VARCHAR(2048),
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "tags" JSONB,
  "views" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Comment" (
  "commentId" BIGSERIAL PRIMARY KEY,
  "newsId" BIGINT REFERENCES "News"("newsId"),
  "content" TEXT,
  "userId" BIGINT REFERENCES "User"("userId"),
  "status" comment_status,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Notification" (
  "notificationId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId"),
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "type" notification_type,
  "public" INT DEFAULT 1,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Lead" (
  "leadId" BIGSERIAL PRIMARY KEY,
  "email" VARCHAR(255),
  "phone" VARCHAR(20),
  "fullname" VARCHAR(255),
  "source" VARCHAR(100),
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "status" lead_status DEFAULT 'NEW',
  "assignedTo" BIGINT REFERENCES "User"("userId"),
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "OTP" (
  "otpId" BIGSERIAL PRIMARY KEY,
  "userId" BIGINT REFERENCES "User"("userId"),
  "channel" otp_channel NOT NULL,
  "from" VARCHAR(100),
  "destination" VARCHAR(255),
  "code" VARCHAR(10) NOT NULL,
  "purpose" otp_purpose NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "delivered" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Suggestion" (
  "suggestionId" BIGSERIAL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "type" suggestion_type NOT NULL,
  "matchedCount" INT NOT NULL DEFAULT 0,
  "foreignKeyId" BIGINT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "FAQ" (
  "faqId" BIGSERIAL PRIMARY KEY,
  "question" VARCHAR(255) NOT NULL,
  "answer" TEXT NOT NULL,
  "projectId" BIGINT REFERENCES "Project"("projectId"),
  "category" faq_category,
  "status" faq_status NOT NULL DEFAULT 'ACTIVE',
  "order" INT DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "ListingPrice" (
  "priceId" BIGSERIAL PRIMARY KEY,
  "priority" INT NOT NULL DEFAULT 0,
  "price" DOUBLE PRECISION NOT NULL,
  "priceBeforeTax" DOUBLE PRECISION NOT NULL,
  "taxRate" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "durationDays" INT NOT NULL,
  "pushCount" INT NOT NULL DEFAULT 0,
  "currency" VARCHAR(10),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Audit" (
  "auditId" BIGSERIAL PRIMARY KEY,
  "objectId" BIGINT NOT NULL,
  "objectType" VARCHAR(50) NOT NULL,
  "action" audit_action NOT NULL,
  "userId" BIGINT REFERENCES "User"("userId") NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Config" (
  "configId" BIGSERIAL PRIMARY KEY,
  "key" VARCHAR(255) NOT NULL,
  "value" TEXT NOT NULL,
  "platform" VARCHAR(50),
  "public" INT DEFAULT 1,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE "Property" ADD CONSTRAINT fk_property_primary_media 
  FOREIGN KEY ("primaryMediaId") REFERENCES "Media"("mediaId");

ALTER TABLE "Project" ADD CONSTRAINT fk_project_primary_media 
  FOREIGN KEY ("primaryMediaId") REFERENCES "Media"("mediaId");

ALTER TABLE "ChatRoom" ADD CONSTRAINT fk_chatroom_last_message 
  FOREIGN KEY ("lastMessageId") REFERENCES "Message"("messageId");

ALTER TABLE "Payment" ADD CONSTRAINT fk_payment_wallet_transaction 
  FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("transactionId");

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_user_phone" ON "User"("phone");
CREATE INDEX "idx_user_status" ON "User"("status");

CREATE INDEX "idx_property_user" ON "Property"("userId");
CREATE INDEX "idx_property_project" ON "Property"("projectId");
CREATE INDEX "idx_property_status" ON "Property"("status");
CREATE INDEX "idx_property_type" ON "Property"("propertyType");

CREATE INDEX "idx_listing_property" ON "Listing"("propertyId");
CREATE INDEX "idx_listing_user" ON "Listing"("userId");
CREATE INDEX "idx_listing_status" ON "Listing"("status");
CREATE INDEX "idx_listing_type" ON "Listing"("listingType");
CREATE INDEX "idx_listing_pushed_date" ON "Listing"("pushedDate" DESC);
CREATE INDEX "idx_listing_priority" ON "Listing"("priority" DESC);

CREATE INDEX "idx_media_property" ON "Media"("propertyId");
CREATE INDEX "idx_media_project" ON "Media"("projectId");
CREATE INDEX "idx_media_user" ON "Media"("userId");

CREATE INDEX "idx_document_property" ON "Document"("propertyId");
CREATE INDEX "idx_document_project" ON "Document"("projectId");

CREATE INDEX "idx_appointment_user" ON "Appointment"("userId");
CREATE INDEX "idx_appointment_listing" ON "Appointment"("listingId");
CREATE INDEX "idx_appointment_datetime" ON "Appointment"("datetime");

CREATE INDEX "idx_transaction_listing" ON "Transaction"("listingId");
CREATE INDEX "idx_transaction_seller" ON "Transaction"("sellerId");
CREATE INDEX "idx_transaction_guest" ON "Transaction"("guestId");

CREATE INDEX "idx_favorite_user" ON "Favorite"("userId");
CREATE INDEX "idx_favorite_listing" ON "Favorite"("listingId");

CREATE INDEX "idx_message_room" ON "Message"("roomId");
CREATE INDEX "idx_message_sender" ON "Message"("senderId");

CREATE INDEX "idx_news_category" ON "News"("categoryId");
CREATE INDEX "idx_news_status" ON "News"("status");

-- ============================================
-- END OF SCHEMA
-- ============================================
