import { useLanguageStore } from '@store/language-store';
import { API_ENDPOINTS, makeApiCall } from '@utils/api-config';

// Get current language from store
const getCurrentLanguage = () => {
  const { currentLanguage } = useLanguageStore.getState();
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
    
    return makeApiCall<any>(endpoint);
  },
  
  getMainMenu: () => makeApiCall<any>(API_ENDPOINTS.menu),
  
  getAllProducts: () => makeApiCall<any>(API_ENDPOINTS.products),
  
  getProductsByCategory: (categoryId: string) => {
    const language = getCurrentLanguage();
    
    return makeApiCall<any>(API_ENDPOINTS.products, {
      params: {
        category: categoryId,
      },
    }).then(response => {
      // Check if the response is successful
      if (response.success === 1 && response.data) {
        let finalProducts = [];
        
        // Handle both response formats (direct array or nested within object)
        if (response.data.products && Array.isArray(response.data.products)) {
          finalProducts = response.data.products;
        } else if (Array.isArray(response.data)) {
          finalProducts = response.data;
        }
        
         finalProducts.forEach((product: any, index: number) => {
        });
        
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
      } 
      
      // Return original response if no products found
      return response;
    });
  },
  
  getProductDetail: (productId: string) => {
    return makeApiCall<any>(API_ENDPOINTS.productDetail, {
      params: { 
        productId,
      },
    }).then(response => {
      if (response.success === 1 && response.data) {
        const product = response.data;
        
      }
      
      return response;
    });
  },
};