import { useState, useEffect } from 'react';
import axios from 'axios';

export interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts: District[];
}

export interface District {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
  wards: Ward[];
}

export interface Ward {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  district_code: number;
}

const API_BASE_URL = 'https://provinces.open-api.vn/api';

export const useVietnamLocations = (
  selectedProvinceCode?: number,
  selectedDistrictCode?: number
) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/p/`);
        setProvinces(response.data);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }

    const fetchDistricts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/p/${selectedProvinceCode}?depth=2`);
        setDistricts(response.data.districts || []);
        setWards([]); // Clear wards when province changes
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDistricts();
  }, [selectedProvinceCode]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/d/${selectedDistrictCode}?depth=2`);
        setWards(response.data.wards || []);
      } catch (error) {
        console.error('Error fetching wards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWards();
  }, [selectedDistrictCode]);

  return { provinces, districts, wards, isLoading };
};
