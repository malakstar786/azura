import { useLanguageStore } from '@store/language-store';
import { API_ENDPOINTS, makeApiCall } from '@utils/api-config';

// Get current language from store
const getCurrentLanguage = () => {
  const { currentLanguage } = useLanguageStore.getState();
  console.log(`API Service: Current language is ${currentLanguage}`);
  return currentLanguage;
};

// Public endpoints
export const publicApi = {
  getHomeServiceBlock: () => makeApiCall<any>(API_ENDPOINTS.homeServiceBlock),
  
  getHomeSliderBlock: () => makeApiCall<any>(API_ENDPOINTS.homeSliderBlock),
  
  getFeaturesBlock: (blockNumber: number) => {
    // Use specific endpoints based on block number
    let endpoint;
    switch (blockNumber) {
      case 1:
        endpoint = API_ENDPOINTS.homeFeaturesBlock1;
        break;
      case 2:
        endpoint = API_ENDPOINTS.homeFeaturesBlock2;
        break;
      case 3:
        endpoint = API_ENDPOINTS.homeFeaturesBlock3;
        break;
      case 4:
        endpoint = API_ENDPOINTS.homeFeaturesBlock4;
        break;
      case 5:
        endpoint = API_ENDPOINTS.homeFeaturesBlock5;
        break;
      case 6:
        endpoint = API_ENDPOINTS.homeFeaturesBlock6;
        break;
      default:
        throw new Error(`Invalid features block number: ${blockNumber}`);
    }
    
    const language = getCurrentLanguage();
    console.log(`Making featuresBlock ${blockNumber} API call with language: ${language}`);
    return makeApiCall<any>(endpoint);
  },
  
  getMainMenu: () => makeApiCall<any>(API_ENDPOINTS.menu),
  
  getAllProducts: () => makeApiCall<any>(API_ENDPOINTS.products),
  
  getProductsByCategory: (categoryId: string) => {
    const language = getCurrentLanguage();
    console.log(`🛍️ [API] Making productsByCategory API call for category ${categoryId} with language: ${language}`);
    
    return makeApiCall<any>(API_ENDPOINTS.products, {
      params: {
        category: categoryId,
      },
    }).then(response => {
      console.log(`🛍️ [API] ========== RAW PRODUCTS RESPONSE ==========`);
      console.log(`🛍️ [API] Category ID: ${categoryId}`);
      console.log(`🛍️ [API] Response success:`, response.success);
      console.log(`🛍️ [API] Full response structure:`, JSON.stringify(response, null, 2));
      
      // Check if the response is successful
      if (response.success === 1 && response.data) {
        let finalProducts = [];
        
        // Handle both response formats (direct array or nested within object)
        if (response.data.products && Array.isArray(response.data.products)) {
          finalProducts = response.data.products;
          console.log(`🛍️ [API] Found ${finalProducts.length} products in nested format`);
        } else if (Array.isArray(response.data)) {
          finalProducts = response.data;
          console.log(`🛍️ [API] Found ${finalProducts.length} products in direct array format`);
        }
        
                 // Log detailed info about each product
         console.log(`🛍️ [API] ========== PRODUCT ANALYSIS ==========`);
         finalProducts.forEach((product: any, index: number) => {
          console.log(`🛍️ [API] Product ${index + 1}:`);
          console.log(`🛍️ [API] - ID: ${product.product_id}`);
          console.log(`🛍️ [API] - Name: ${product.name}`);
          console.log(`🛍️ [API] - Stock Status: "${product.stock_status}" (type: ${typeof product.stock_status})`);
          console.log(`🛍️ [API] - Quantity: ${product.quantity} (type: ${typeof product.quantity})`);
          console.log(`🛍️ [API] - Price: ${product.price}`);
                     console.log(`🛍️ [API] - Is In Stock (quantity > 0): ${Number(product.quantity) > 0}`);
           console.log(`🛍️ [API] - Full product object:`, JSON.stringify(product, null, 2));
          console.log(`🛍️ [API] --------------------------------`);
        });
        console.log(`🛍️ [API] ========== END PRODUCT ANALYSIS ==========`);
        
        // Handle both response formats
        if (response.data.products && Array.isArray(response.data.products)) {
          return {
            ...response,
            data: response.data
          };
        } else if (Array.isArray(response.data)) {
          return {
            ...response,
            data: { products: response.data, product_total: response.data.length }
          };
        }
      } else {
        console.log(`🛍️ [API] ❌ API call failed or no data:`, response.error);
      }
      
      // Return original response if no products found
      return response;
    });
  },
  
  getProductDetail: (productId: string) => {
    const language = getCurrentLanguage();
    console.log(`🔍 [API] Making productDetail API call for product ${productId} with language: ${language}`);
    return makeApiCall<any>(API_ENDPOINTS.productDetail, {
      params: { 
        productId,
      },
    }).then(response => {
      console.log(`🔍 [API] ========== RAW PRODUCT DETAIL RESPONSE ==========`);
      console.log(`🔍 [API] Product ID: ${productId}`);
      console.log(`🔍 [API] Response success:`, response.success);
      console.log(`🔍 [API] Full response structure:`, JSON.stringify(response, null, 2));
      
      if (response.success === 1 && response.data) {
        const product = response.data;
        console.log(`🔍 [API] ========== PRODUCT DETAIL ANALYSIS ==========`);
        console.log(`🔍 [API] - ID: ${product.product_id}`);
        console.log(`🔍 [API] - Name: ${product.name}`);
        console.log(`🔍 [API] - Stock Status: "${product.stock_status}" (type: ${typeof product.stock_status})`);
        console.log(`🔍 [API] - Quantity: ${product.quantity} (type: ${typeof product.quantity})`);
        console.log(`🔍 [API] - Price: ${product.price}`);
        console.log(`🔍 [API] - Is In Stock (quantity > 0): ${Number(product.quantity) > 0}`);
        console.log(`🔍 [API] - Description length: ${product.description?.length || 0}`);
        console.log(`🔍 [API] - Image: ${product.image}`);
        console.log(`🔍 [API] - SKU: ${product.sku}`);
        console.log(`🔍 [API] - Date Added: ${product.date_added}`);
        console.log(`🔍 [API] - Full product object:`, JSON.stringify(product, null, 2));
        console.log(`🔍 [API] ========== END PRODUCT DETAIL ANALYSIS ==========`);
      } else {
        console.log(`🔍 [API] ❌ Product detail API call failed or no data:`, response.error);
      }
      
      return response;
    });
  },
};