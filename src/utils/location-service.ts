import { API_ENDPOINTS, getActiveCountryId, makeApiCall } from '@utils/api-config';

export interface Country {
  country_id: string;
  name: string;
  iso_code_2: string;
  iso_code_3: string;
  address_format_id: string;
  postcode_required: string;
  status: string;
  language_id: string;
  address_format: string;
}

export interface Governorate {
  governorate_id: string;
  name: string;
  name_ar: string;
  country_id: string;
}

export interface Zone {
  zone_id: string;
  country_id: string;
  name: string;
  code: string;
  status: string;
  governorate_id: string;
  governorate: string;
}

export interface LocationResponse {
  country_id: string;
  name: string;
  iso_code_2: string;
  iso_code_3: string;
  address_format: string;
  postcode_required: string;
  governorates: Governorate[];
  zone: Zone[];
  status: string;
}

export class LocationService {
  static async getCountries(): Promise<Country[]> {
    try {
      const response = await makeApiCall(API_ENDPOINTS.countries, {
        method: 'POST'
      });
      
      if (response.success === 1 && response.data?.countries) {
        return response.data.countries;
      }
      
      throw new Error('Failed to fetch countries');
    } catch (error: any) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  static async getGovernoratesAndAreas(countryId?: string, governorateId?: string): Promise<LocationResponse> {
    try {
      const activeCountryId = countryId || await getActiveCountryId();
      const params: Record<string, string> = { country_id: activeCountryId };
      
      if (governorateId) {
        params.governorate_id = governorateId;
      }

      const response = await makeApiCall(API_ENDPOINTS.governoratesAndAreas, {
        method: 'POST',
        params
      });
      
      // This endpoint returns data directly, not in the standard format
      if (response && typeof response === 'object' && 'country_id' in response) {
        return response as unknown as LocationResponse;
      }
      
      throw new Error('Failed to fetch governorates and areas');
    } catch (error: any) {
      console.error('Error fetching governorates and areas:', error);
      throw error;
    }
  }

  static async getAreasByGovernorate(countryId: string | undefined, governorateId: string): Promise<Zone[]> {
    try {
      const locationData = await this.getGovernoratesAndAreas(countryId, governorateId);
      return locationData.zone || [];
    } catch (error: any) {
      console.error('Error fetching areas by governorate:', error);
      throw error;
    }
  }
} 