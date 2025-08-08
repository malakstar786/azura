# Azura Mobile App - Product Requirements Document (PRD)

## Project Overview

Azura is a cross-platform eCommerce mobile application for iOS and Android that specializes in selling nail care products, makeup products, and fragrances. The app provides a seamless shopping experience where users can browse products, add them to cart, and complete purchases directly within the app.

### Technology Stack
- **Frontend**: Expo
- **State Management**: Zustand
- **UI Notifications**: Toast
- **Languages**: TypeScript

## Core Features

### 1. Multi-Language Support
- **Language Selection**: Users can choose between English and Arabic
- **First-time Users**: Language selection screen appears after splash screen
- **Existing Users**: Can switch languages from Account tab
- **API Integration**: Language parameter (`language=ar`) is passed to all API calls for localized content

### 2. Product Discovery
- **Home Tab**: Featured products and category exploration
- **Search Tab**: Product search with auto-suggestions
- **Categories**: Three main categories - Nail Care, Makeup, and Fragrance
- **Product Details**: Individual product pages with detailed information

### 3. Shopping Cart & Checkout
- **Add to Cart**: From product listings or individual product pages
- **Cart Management**: Update quantities, remove items
- **Quick Purchase**: "Buy Now" button for direct checkout
- **Authentication**: Login/signup required before checkout
- **Payment Methods**: Cash on Delivery and Credit Card options

### 4. User Authentication
- **Login/Signup**: Email-based authentication
- **Guest Browsing**: Users can browse without account
- **Password Recovery**: Forgot password functionality
- **Profile Management**: Edit user details and addresses

### 5. Address Management
- **Multiple Addresses**: Users can save multiple delivery addresses
- **Kuwait-specific Fields**: Block, Street, House/Building, Apartment numbers
- **Default Address**: Set primary address for quick checkout

### 6. Order Management
- **Order History**: View past orders with details
- **Order Status**: Track order progress
- **Order Details**: Complete order information including payment method

## UI/UX Design System

### Color Palette
The app follows a minimalist black and white design aesthetic with carefully chosen accent colors:

#### Primary Colors
- **White**: `#FFFFFF` - Primary background, card backgrounds, button text
- **Black**: `#000000` - Primary text, buttons, borders, headers
- **Dark Gray**: `#231F20` - Secondary text, muted content
- **Medium Gray**: `#5D5D5D` - Tertiary text, placeholders, disabled states
- **Light Gray**: `#EFEFEF` - Borders, dividers, input backgrounds

#### Usage Guidelines
- **Black (#000000)**: Used for primary buttons, main text, navigation headers, and key UI elements
- **White (#FFFFFF)**: Used for backgrounds, secondary button text, and contrast elements
- **Dark Gray (#231F20)**: Used for secondary text and subtle UI elements
- **Medium Gray (#5D5D5D)**: Used for placeholder text, disabled states, and tertiary information
- **Light Gray (#EFEFEF)**: Used for borders, dividers, and subtle background variations

### Typography
- **Font Family**: System default (San Francisco on iOS, Roboto on Android)
- **Font Sizes**: 
  - Extra Small: 10px (badges, fine print)
  - Small: 12px (captions, helper text)
  - Medium: 14px (body text, form inputs)
  - Large: 16px (primary text, button labels)
  - Extra Large: 18px (section headers)
  - XXL: 24px (page titles)
  - XXXL: 32px (hero titles)
- **Font Weights**:
  - Normal: 400 (body text)
  - Medium: 500 (emphasized text)
  - Semibold: 600 (section headers, button text)
  - Bold: 700 (page titles, important labels)

### Layout Principles
- **Spacing**: Consistent 8px grid system (4px, 8px, 16px, 24px, 32px, 40px)
- **Margins**: 16px standard horizontal padding, 20px for content sections
- **Border Radius**: Minimal use - 4px for inputs, 8px for cards, 0px for buttons (sharp edges)
- **Shadows**: Subtle elevation using black shadows with low opacity

### Component Styling

#### Buttons
- **Primary Button**: Black background (#000000), white text, sharp corners (0px radius)
- **Secondary Button**: White background, black border (1px), black text
- **Button Height**: 44-48px for optimal touch targets
- **Button Text**: 14-16px, semibold weight, uppercase for primary actions

#### Input Fields
- **Border**: 1px solid black (#000000)
- **Padding**: 12-16px horizontal, 12-16px vertical
- **Background**: White (#FFFFFF)
- **Text**: 14px, normal weight
- **Placeholder**: Medium gray (#5D5D5D)
- **Focus State**: Maintain black border, no additional styling

#### Cards and Containers
- **Background**: White (#FFFFFF)
- **Border**: 1px solid light gray (#EFEFEF) when needed
- **Padding**: 16px standard, 20px for content-heavy cards
- **Shadow**: Minimal elevation for floating elements

#### Navigation
- **Tab Bar**: White background, black icons and text
- **Active Tab**: Black color for icon and text
- **Inactive Tab**: Medium gray (#5D5D5D)
- **Badge**: Black background, white text, circular

### Screen Layouts

#### Home Screen
- **Header**: Black background, white "AZURA" logo text (24px, semibold, letter-spacing: 4px)
- **Hero Section**: Full-screen image with overlay text
- **Product Sections**: Full-width images with centered content overlays
- **Service Icons**: White icons on black backgrounds

#### Product Listing
- **Grid Layout**: 2 columns on mobile, 3+ on tablets
- **Product Cards**: White background, minimal borders
- **Product Images**: Square aspect ratio, contained fit
- **"NEW ARRIVAL" Badge**: Black background, white text, positioned top-left

#### Product Detail
- **Image**: Full-width, square aspect ratio
- **Content**: 16px horizontal padding
- **Price**: 24px, semibold weight
- **Buttons**: Full-width, stacked vertically with 8px gap

#### Cart
- **Empty State**: Centered icon and text with call-to-action button
- **Item List**: Horizontal layout with 80px square images
- **Quantity Controls**: 28px square buttons with +/- symbols
- **Summary**: Clear hierarchy with dividers and bold totals

#### Authentication
- **Form Layout**: Single column, full-width inputs
- **Title**: 32px, bold weight
- **Divider**: 2px black line below title
- **Input Spacing**: 16px between fields
- **Submit Button**: Full-width, black background

#### Checkout
- **Step Indicators**: Minimal design with clear progression
- **Address Cards**: White background with subtle borders
- **Payment Options**: Radio button selection with clear visual feedback
- **Order Summary**: Boxed layout with clear totals

### Accessibility
- **Touch Targets**: Minimum 44px height for all interactive elements
- **Contrast**: High contrast between text and backgrounds (black on white)
- **Text Scaling**: Support for dynamic type sizes
- **Screen Reader**: Proper accessibility labels and hints
- **Focus States**: Clear visual indication for keyboard navigation

### Animation and Transitions
- **Duration**: 200-300ms for micro-interactions
- **Easing**: Standard iOS/Android easing curves
- **Loading States**: Simple activity indicators, no complex animations
- **Page Transitions**: Standard navigation transitions

### Responsive Design
- **Mobile First**: Optimized for iPhone and Android phones
- **Tablet Support**: Adaptive layouts for larger screens
- **Safe Areas**: Proper handling of notches and home indicators
- **Orientation**: Portrait primary, landscape support where appropriate

## Application Structure

### Navigation
The app uses a bottom tab navigation with four main tabs:

#### 1. Home Tab
- Hero image with call-to-action
- Featured product sections for each category
- Category exploration buttons
- Scrollable content with multiple promotional sections

#### 2. Search Tab
- Search bar with product suggestions
- Real-time search results
- Product not found handling

#### 3. Cart Tab
- **Empty State**: Cart icon with "Start Shopping" button
- **With Items**: Product list with quantities, prices, and remove options
- **Cart Summary**: Subtotal, shipping, and total calculations
- **Checkout Button**: Proceeds to checkout flow

#### 4. Account Tab
- **Unauthenticated**: Login/Register options, language settings
- **Authenticated**: User profile, addresses, orders, logout

### Screen Flows

#### Authentication Flow
1. **Sign In**: Email and password with forgot password option
2. **Sign Up**: Full name, email, mobile number, password
3. **Forgot Password**: Email-based password recovery

#### Checkout Flow
1. **Authentication Check**: Redirect to login if not authenticated
2. **Address Selection**: Choose or add delivery address
3. **Order Summary**: Review items and totals
4. **Payment Method**: Cash on Delivery or Credit Card
5. **Order Confirmation**: Success/failure page

#### Address Management
1. **Add Address**: Modal with Kuwait-specific fields
2. **Edit Address**: Modify existing address details
3. **Default Address**: Set primary address for checkout

## API Integration

### Base Configuration
- **Base URL**: `https://azura.com.kw`
- **Session Management**: OCSESSID cookie for all requests (randomly generated UUID)
- **Language Support**: `language=ar` parameter for Arabic content
- **Content Type**: `application/json` for most requests, `multipart/form-data` for file uploads
- **Authentication**: Session-based using OCSESSID cookie

### Response Format
All API responses follow this standard format:
```json
{
  "success": 1,        // 1 for success, 0 for failure
  "error": [],         // Array of error messages (empty on success)
  "data": {}           // Response data (null on error)
}
```

### Authentication Endpoints

Test Credentials: 
- hussain.b@test.com
  87654321

- hb@test5.com
  hb@test5.com

#### 1. User Registration
- **Endpoint**: `POST /index.php?route=extension/mstore/account|register`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "firstname": "TestUser",
  "lastname": "ApiTest", 
  "email": "user@example.com",
  "telephone": "99887766",
  "password": "TestPass123!"
}
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "customer_id": "19071",
    "message": "Success: Your account has been successfully created!"
  }
}
```
- **Error Response** (200):
```json
{
  "success": 0,
  "error": ["E-Mail Address is already registered!"],
  "data": null
}
```

#### 2. User Login
- **Endpoint**: `POST /index.php?route=extension/mstore/account|login`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "TestPass123!"
}
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "customer_id": "19071",
    "firstname": "TestUser",
    "lastname": "ApiTest",
    "email": "user@example.com",
    "telephone": "99887766"
  }
}
```
- **Error Response** (200):
```json
{
  "success": 0,
  "error": ["Warning: No match for E-Mail Address and/or Password."],
  "data": null
}
```

#### 3. Forgot Password
- **Endpoint**: `POST /index.php?route=extension/mstore/account|forgetPassword`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "An email with a confirmation link has been sent your email address."
  }
}
```

#### 4. Update Profile
- **Endpoint**: `POST /index.php?route=extension/mstore/account|edit`
- **Content-Type**: `application/json`
- **Authentication**: Required (OCSESSID)
- **Request Body**:
```json
{
  "firstname": "UpdatedFirst",
  "lastname": "UpdatedLast",
  "email": "user@example.com",
  "telephone": "99887755"
}
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "customer_id": "19071",
    "firstname": "UpdatedFirst",
    "lastname": "UpdatedLast",
    "email": "user@example.com",
    "telephone": "99887755"
  }
}
```

### Product Endpoints

#### 1. Get All Products
- **Endpoint**: `GET /index.php?route=extension/mstore/product`
- **Query Parameters**: 
  - `language=ar` (optional) - for Arabic content
  - `page=1` (optional) - pagination
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "products": [
      {
        "product_id": "65",
        "name": "AGARWOOD",
        "description": "Product description...",
        "price": "22.500 KD",
        "special": null,
        "tax": "22.500 KD",
        "rating": 0,
        "reviews": 0,
        "href": "https://new.azurakwt.com/en-gb/product/Agarwood",
        "thumb": "https://new.azurakwt.com/image/cache/catalog/productsimage/agarwood/Image%202%20(4)-228x228.png",
        "images": ["image1.png", "image2.png"]
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20
    }
  }
}
```

#### 2. Get Products by Category
- **Endpoint**: `GET /index.php?route=extension/mstore/product?category={id}`
- **Category IDs**:
  - Nail Care: `20`
  - Makeup: `18` 
  - Fragrance: `57`
- **Success Response**: Same format as "Get All Products"

#### 3. Get Product Detail
- **Endpoint**: `GET /index.php?route=extension/mstore/product|detail?productId={id}`
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "product_id": "65",
    "name": "AGARWOOD",
    "description": "Detailed product description...",
    "price": "22.500 KD",
    "special": null,
    "images": ["image1.png", "image2.png"],
    "options": [],
    "variants": [],
    "stock": true,
    "minimum": 1
  }
}
```

### Home Content Endpoints

#### 1. Service Block
- **Endpoint**: `GET /index.php?route=extension/mstore/home|serviceBlock`
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "heading_text": "Our Services",
    "description": "Service description",
    "image": "service-image.png",
    "href": "service-link"
  }
}
```

#### 2. Slider Block
- **Endpoint**: `GET /index.php?route=extension/mstore/home|sliderblock`
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "slides": [
      {
        "image": "slide1.png",
        "title": "Slide Title",
        "description": "Slide Description",
        "href": "slide-link"
      }
    ]
  }
}
```

#### 3. Features Blocks (1-6)
- **Endpoints**: 
  - `GET /index.php?route=extension/mstore/home|featuresblock1`
  - `GET /index.php?route=extension/mstore/home|featuresblock2`
  - `GET /index.php?route=extension/mstore/home|featuresBlock3`
  - `GET /index.php?route=extension/mstore/home|featuresBlock4`
  - `GET /index.php?route=extension/mstore/home|featuresBlock5`
  - `GET /index.php?route=extension/mstore/home|featuresBlock6`
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "subtitle": "Feature Subtitle",
    "heading": "Feature Heading",
    "description": "Feature Description",
    "image": "feature-image.png",
    "href": "feature-link",
    "products": [...]
  }
}
```

#### 4. Main Menu
- **Endpoint**: `GET /index.php?route=extension/mstore/menu`
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "categories": [
      {
    "category_id": "20",
            "name": "Nail Care",
        "image": "category-image.png",
        "href": "category-link",
        "children": [...]
      }
    ]
  }
}
```

### Cart Endpoints

#### 1. Get Cart
- **Endpoint**: `GET /index.php?route=extension/mstore/cart`
- **Success Response (Empty Cart)** (200):
```json
{
  "success": 1,
  "error": [],
  "data": null
}
```
- **Success Response (With Items)** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "products": [
      {
        "cart_id": "1597",
        "product_id": "65",
        "name": "AGARWOOD",
        "model": "Agarwood123",
        "sku": "Agarwood123",
        "thumb": "product-thumb.png",
        "quantity": "1",
        "price": "22.500 KD",
        "total": "22.500 KD",
        "stock": true,
        "minimum": true,
        "maximum": true,
        "option": [],
        "href": "product-link"
      }
    ],
    "totals": {
      "subtotal": "22.500 KD",
      "shipping": "0.000 KD",
      "total": "22.500 KD"
    }
  }
}
```

#### 2. Add to Cart
- **Endpoint**: `POST /index.php?route=extension/mstore/cart|add`
- **Content-Type**: `application/json`
- **Request Body**:
```json
[{
  "product_id": "65",
  "quantity": "1"
}]
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "total_product_count": 1
  }
}
```
- **Error Response** (200):
```json
{
  "success": 0,
  "error": ["Product not found or out of stock"],
  "data": null
}
```

#### 3. Update Cart Quantity
- **Endpoint**: `POST /index.php?route=extension/mstore/cart|edit`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Request Body**:
```
cart_id=40&quantity=2
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Cart updated successfully"
  }
}
```

#### 4. Remove Cart Item
- **Endpoint**: `POST /index.php?route=extension/mstore/cart|remove`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Request Body**:
```
cart_id=1597
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Item removed from cart"
  }
}
```

#### 5. Empty Cart
- **Endpoint**: `DELETE /index.php?route=extension/mstore/cart|emptyCart`
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Cart emptied successfully"
  }
}
```

### Address Endpoints

#### 1. Get Addresses
- **Endpoint**: `GET /index.php?route=extension/mstore/account|addresses`
- **Authentication**: Required (OCSESSID)
- **Success Response (Empty)** (200):
```json
{
    "success": 1,
    "error": [],
  "data": []
}
```
- **Success Response (With Addresses)** (200):
```json
{
    "success": 1,
    "error": [],
    "data": [
        {
      "address_id": "38431",
      "firstname": "Hussein",
      "lastname": "122233",
            "company": "",
      "address_1": "Block 1, Street 11, House/Building 1, Apt 1",
      "address_2": "",
            "postcode": "",
            "city": "",
            "city_name": "",
            "zone_id": "1785",
            "zone": "",
            "zone_code": "",
            "country_id": "114",
            "country": "Kuwait",
            "iso_code_2": "KW",
            "iso_code_3": "KWT",
            "address_format": "Hussein 122233<br/>Kuwait,<br/>, ,<br/>, 1 ,11, 1",
            "custom_field": {
        "30": "1",    // Block
        "31": "11",   // Street
        "32": "1",    // House/Building
        "33": "1"     // Apartment
      },
            "default": "0"
        }
    ]
}
```

#### 2. Add/Edit Address
- **Endpoint**: `POST /index.php?route=extension/mstore/account|edit_address`
- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (OCSESSID)
- **Request Body (FormData)**:
```
firstname: TestUser
lastname: ApiTest
company: 
address_1: Block 5, Street 10
address_2: Additional info
city: Kuwait City
postcode: 
country_id: 114
zone_id: 1785
custom_field[30]: 5    // Block
custom_field[31]: 10   // Street
custom_field[32]: 15   // House/Building
custom_field[33]: 2    // Apartment
default: 1
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "address_id": "123",
    "message": "Address saved successfully"
  }
}
```

### Order Endpoints

#### 1. Get Order History
- **Endpoint**: `GET /index.php?route=extension/mstore/order|all`
- **Authentication**: Required (OCSESSID)
- **Success Response** (200):
```json
{
    "success": 1,
    "error": [],
    "data": [
        {
      "order_id": "54251",
            "firstname": "Burhan",
            "lastname": "Bohra",
            "status": "Pending",
      "date_added": "2025-05-25 12:47:42",
      "total": "17.5000",
            "currency_code": "KWD",
            "currency_value": "1.00000000"
        }
    ]
}
```

### Checkout Endpoints

#### 1. Checkout (Set Address)
- **Endpoint**: `POST /index.php?route=extension/mstore/confirm`
- **Content-Type**: `application/json`
- **Authentication**: Required (OCSESSID)
- **Request Body**:
```json
{
  "payment_address": "existing",
  "address_id": "123"
}
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Address set successfully"
  }
}
```

#### 2. Set Shipping Method
- **Endpoint**: `POST /index.php?route=extension/mstore/shipping_method`
- **Content-Type**: `application/json`
- **Authentication**: Required (OCSESSID)
- **Request Body**:
```json
  {
  "shipping_method": "flat.flat"
  }
```
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Shipping method set successfully"
  }
}
```

#### 3. Set Payment Method
- **Endpoint**: `POST /index.php?route=extension/mstore/payment_method`
- **Content-Type**: `application/json`
- **Authentication**: Required (OCSESSID)
- **Request Body**:
```json
{
  "payment_method": "cod"
}
```
- **Available Payment Methods**:
  - `cod` - Cash on Delivery
  - `credit_card` - Credit Card
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Payment method set successfully"
  }
}
```

#### 4. Confirm Order
- **Endpoint**: `POST /index.php?route=extension/mstore/order|confirm`
- **Content-Type**: `application/json`
- **Authentication**: Required (OCSESSID)
- **Success Response** (200):
```json
{
  "success": 1,
  "error": [],
  "data": {
    "order_id": "54252",
    "message": "Order placed successfully"
  }
}
```
- **Error Response** (200):
```json
{
  "success": 0,
  "error": ["Cart is empty", "Address not set", "Payment method not selected"],
  "data": null
}
```

### Currency and Location Endpoints

#### 1. Get Currencies List
- **Endpoint**: `GET /index.php?route=extension/mstore/currency`
- **Success Response** (200):
```json
{
    "success": 1,
    "error": [],
  "data": {
    "action": "https://new.azurakwt.com/en-gb?route=common/currency|save",
    "code": "KWD",
    "currencies": [
      {
        "title": "BRN",
        "code": "BHD",
        "symbol_left": "",
        "symbol_right": "KD",
        "image": "https://new.azurakwt.com/image/catalog/flags/BRN.png"
      },
      {
        "title": "KWT",
        "code": "KWD",
        "symbol_left": "",
        "symbol_right": "KD",
        "image": "https://new.azurakwt.com/image/catalog/flags/KWT.png"
      }
    ],
    "selected_currency_title": "KWT",
    "selected_currency_image": "https://new.azurakwt.com/image/catalog/flags/KWT.png",
    "selected_currency_code": "KWD",
    "selected_currency_symbol_left": "",
    "selected_currency_symbol_right": "KD"
  }
}
```

#### 2. Change Currency
- **Endpoint**: `POST /index.php?route=extension/mstore/currency|Save`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Request Body**:
```
code=KWD
```
- **Available Currency Codes**:
  - `BHD` - Bahraini Dinar
  - `JOD` - Jordanian Dinar
  - `SAR` - Saudi Riyal
  - `KWD` - Kuwaiti Dinar (default)
  - `OMR` - Omani Rial
  - `QAR` - Qatari Riyal
  - `AED` - UAE Dirham
- **Success Response** (200):
```json
{
    "success": 1,
    "error": [],
  "data": []
}
```
- **Note**: Response is same for both valid and invalid currency codes

#### 3. Get Countries List
- **Endpoint**: `POST /index.php?route=extension/mstore/account|getCountries`
- **Success Response** (200):
```json
{
    "success": 1,
    "error": [],
  "data": {
    "countries": [
      {
        "country_id": "114",
        "name": "Kuwait",
        "iso_code_2": "KW",
        "iso_code_3": "KWT",
        "address_format_id": "1",
        "postcode_required": "0",
        "status": "1",
        "language_id": "1",
        "address_format": "{firstname} {lastname}\r\n{country},\r\n{city_name}, {zone}, {custom_field.35} , {custom_field.30} ,{custom_field.31}, {custom_field.32}\r\n{address_2}"
      }
    ]
  }
}
```

#### 4. Get Governorates and Areas
- **Endpoint**: `POST /index.php?route=localisation/country`
- **Query Parameters**:
  - `language=en-gb` (required) - Language code
  - `country_id=114` (required) - Country ID (114 for Kuwait)
  - `governorate_id=1` (optional) - Governorate ID to filter areas
- **Success Response** (200):
```json
{
  "country_id": "114",
  "name": "Kuwait",
  "iso_code_2": "KW",
  "iso_code_3": "KWT",
  "address_format": "{firstname} {lastname}\r\n{country},\r\n{city_name}, {zone}, {custom_field.35} , {custom_field.30} ,{custom_field.31}, {custom_field.32}\r\n{address_2}",
  "postcode_required": "0",
  "governorates": [
    {
      "governorate_id": "1",
      "name": "Ahmadi",
      "name_ar": "الاحمدي",
      "country_id": "114"
    },
    {
      "governorate_id": "2",
      "name": "Farwaniya",
      "name_ar": "الفروانية",
      "country_id": "114"
    },
    {
      "governorate_id": "5",
      "name": "Kuwait City",
      "name_ar": "مدينة الكويت",
      "country_id": "114"
    }
  ],
  "zone": [
    {
      "zone_id": "4868",
      "country_id": "114",
      "name": "Abu Halifa",
      "code": "Abu Halifa",
      "status": "1",
      "governorate_id": "1",
      "governorate": "Ahmadi"
    }
  ],
  "status": "1"
}
```
- **Error Response (Invalid Country)** (200):
```json
[]
```

#### Kuwait Governorates
- **Ahmadi** (ID: 1): Abu Halifa, Al Ahmadi, Al-Fintas, Fahaheel, Mahboula, Mangaf, etc.
- **Farwaniya** (ID: 2): Abdullah Al Mubarak, Andalus, Ardhiya, Farwaniya, Khaitan, etc.
- **Hawally** (ID: 3): Hawally, Salmiya, Jabriya, Maidan Hawally, etc.
- **Jahra** (ID: 4): Jahra, Sulaibiya, Qasr, etc.
- **Kuwait City** (ID: 5): Kuwait City, Sharq, Jibla, Mirqab, etc.
- **Mubarak Al Kabir** (ID: 6): Mubarak Al Kabir, Adan, Qurain, etc.


#### 5. Add Shipping Address
- **Endpoint**: `POST /index.php?route=extension/mstore/shipping_address|save`
- **Content-Type**: `application/json`
- **Authentication**: Required (OCSESSID)
- **Request Body**:
```json
{
  "firstname": "Hussain",
  "lastname": "Test",
  "email": "user@example.com",
  "telephone": "67753850",
  "country_id": "114",
  "city": "1",
  "zone_id": "4868",
  "address_2": "Additional address info",
  "custom_field": {
    "32": "Building 123",
    "30": "Block 5",
    "31": "Street 10",
    "33": "Apartment 2"
  }
}
```
- **Response**: 
```json
{
    "success": 1,
    "error": [],
    "data": {
        "address_id": "38440",
        "firstname": "Hussain",
        "lastname": "Test",
        "company": "",
        "address_1": "",
        "address_2": "Additional address info",
        "postcode": "",
        "city": "1",
        "city_name": "Ahmadi",
        "zone_id": "4868",
        "zone": "Abu Halifa",
        "zone_code": "Abu Halifa",
        "country_id": "114",
        "country": "Kuwait",
        "iso_code_2": "KW",
        "iso_code_3": "KWT",
        "address_format": "Hussain Test<br/>Kuwait,<br/>Ahmadi, Abu Halifa,<br/>, Block 5 ,Street 10, Building 123<br/>Additional address info",
        "custom_field": {
            "32": "Building 123",
            "30": "Block 5",
            "31": "Street 10",
            "33": "Apartment 2"
        },
        "default": "0",
        "telephone": "67753850"
    }
}
```

#### 6. Add Payment Address
- **Endpoint**: `POST /index.php?route=extension/mstore/payment_address|save`
- **Content-Type**: `application/json`
- **Authentication**: Required (OCSESSID)
- **Response**: 
```json
{
    "success": 1,
    "error": [],
    "data": []
}
```

### Shipping Method API

**Endpoint:** `/index.php?route=extension/mstore/shipping_method`
**Method:** GET

#### Response Format:
```json
{
  "success": 1,
  "error": [],
  "data": {
    "error_warning": "error_no_shipping", // When no address is set
    "shipping_methods": [], // Empty when no address, populated when address exists
    "code": "",
    "comment": ""
  }
}
```

**Endpoint:** `/index.php?route=extension/mstore/shipping_method|save`
**Method:** POST

#### Request Body:
```json
{
  "shipping_method": "flat.flat"
}
```

#### Success Response:
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Success: Shipping method has been set!",
    "code": "flat.flat"
  }
}
```

### Payment Method API

**Endpoint:** `/index.php?route=extension/mstore/payment_method`
**Method:** GET

#### Response Format:
```json
{
  "success": 1,
  "error": [],
  "data": {
    "error_warning": "error_no_payment", // When no address is set
    "payment_methods": [], // Empty when no address, populated when address exists
    "code": "",
    "comment": ""
  }
}
```

**Endpoint:** `/index.php?route=extension/mstore/payment_method|save`
**Method:** POST

#### Request Body:
```json
{
  "payment_method": "knet"
}
```

#### Success Response:
```json
{
  "success": 1,
  "error": [],
  "data": {
    "message": "Success: Payment method has been set!",
    "code": "knet"
  }
}
```

### Error Handling

#### Common Error Responses
- **Authentication Required**:
```json
  {
  "success": 0,
  "error": ["Authentication required"],
  "data": null
  }
```

- **Invalid Parameters**:
```json
{
  "success": 0,
  "error": ["Invalid product ID", "Quantity must be greater than 0"],
  "data": null
}
```

- **Server Error**:
```json
{
  "success": 0,
  "error": ["Internal server error"],
  "data": null
}
```

### Kuwait-Specific Data

#### Country and Zone IDs
- **Kuwait Country ID**: `114`
- **Kuwait City Zone ID**: `1785`

#### Custom Fields for Addresses
- **Field 30**: Block number
- **Field 31**: Street number  
- **Field 32**: House/Building number
- **Field 33**: Apartment number

### API Endpoints Summary

The Azura mobile app integrates with **32 total API endpoints** across 8 categories:

#### Endpoint Categories
1. **Authentication** (4 endpoints): Registration, login, forgot password, profile update
2. **Product Management** (3 endpoints): All products, category products, product details
3. **Home Content** (8 endpoints): Service block, slider, 6 feature blocks, main menu
4. **Shopping Cart** (5 endpoints): Get cart, add item, update quantity, remove item, empty cart
5. **Address Management** (2 endpoints): Get addresses, add/edit address
6. **Order Management** (1 endpoint): Order history
7. **Checkout Process** (4 endpoints): Set address, shipping method, payment method, confirm order
8. **Currency & Location** (4 endpoints): Get currencies, change currency, get countries, get governorates/areas
9. **Search** (1 endpoint): Product search with suggestions

#### Authentication Requirements
- **Public Endpoints** (12): All home content, products, currencies, countries, governorates
- **Authenticated Endpoints** (20): Cart operations, addresses, orders, checkout, profile updates

