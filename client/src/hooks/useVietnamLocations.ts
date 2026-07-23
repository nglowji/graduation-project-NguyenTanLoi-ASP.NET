import { useEffect, useMemo, useState } from 'react';
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

type ProvinceGroup = {
  name: string;
  codename: string;
  division_type: string;
  oldNames: string[];
};

const API_BASE_URL = 'https://provinces.open-api.vn/api';

const CURRENT_PROVINCES: ProvinceGroup[] = [
  { name: 'Thành phố Hà Nội', codename: 'ha_noi', division_type: 'thành phố trung ương', oldNames: ['Thành phố Hà Nội'] },
  { name: 'Thành phố Hồ Chí Minh', codename: 'ho_chi_minh', division_type: 'thành phố trung ương', oldNames: ['Thành phố Hồ Chí Minh', 'Tỉnh Bình Dương', 'Tỉnh Bà Rịa - Vũng Tàu'] },
  { name: 'Thành phố Hải Phòng', codename: 'hai_phong', division_type: 'thành phố trung ương', oldNames: ['Thành phố Hải Phòng', 'Tỉnh Hải Dương'] },
  { name: 'Thành phố Đà Nẵng', codename: 'da_nang', division_type: 'thành phố trung ương', oldNames: ['Thành phố Đà Nẵng', 'Tỉnh Quảng Nam'] },
  { name: 'Thành phố Huế', codename: 'hue', division_type: 'thành phố trung ương', oldNames: ['Tỉnh Thừa Thiên Huế', 'Thành phố Huế'] },
  { name: 'Thành phố Cần Thơ', codename: 'can_tho', division_type: 'thành phố trung ương', oldNames: ['Thành phố Cần Thơ', 'Tỉnh Sóc Trăng', 'Tỉnh Hậu Giang'] },
  { name: 'Tỉnh Tuyên Quang', codename: 'tuyen_quang', division_type: 'tỉnh', oldNames: ['Tỉnh Tuyên Quang', 'Tỉnh Hà Giang'] },
  { name: 'Tỉnh Lào Cai', codename: 'lao_cai', division_type: 'tỉnh', oldNames: ['Tỉnh Lào Cai', 'Tỉnh Yên Bái'] },
  { name: 'Tỉnh Lai Châu', codename: 'lai_chau', division_type: 'tỉnh', oldNames: ['Tỉnh Lai Châu'] },
  { name: 'Tỉnh Điện Biên', codename: 'dien_bien', division_type: 'tỉnh', oldNames: ['Tỉnh Điện Biên'] },
  { name: 'Tỉnh Sơn La', codename: 'son_la', division_type: 'tỉnh', oldNames: ['Tỉnh Sơn La'] },
  { name: 'Tỉnh Thái Nguyên', codename: 'thai_nguyen', division_type: 'tỉnh', oldNames: ['Tỉnh Thái Nguyên', 'Tỉnh Bắc Kạn'] },
  { name: 'Tỉnh Cao Bằng', codename: 'cao_bang', division_type: 'tỉnh', oldNames: ['Tỉnh Cao Bằng'] },
  { name: 'Tỉnh Lạng Sơn', codename: 'lang_son', division_type: 'tỉnh', oldNames: ['Tỉnh Lạng Sơn'] },
  { name: 'Tỉnh Quảng Ninh', codename: 'quang_ninh', division_type: 'tỉnh', oldNames: ['Tỉnh Quảng Ninh'] },
  { name: 'Tỉnh Bắc Ninh', codename: 'bac_ninh', division_type: 'tỉnh', oldNames: ['Tỉnh Bắc Ninh', 'Tỉnh Bắc Giang'] },
  { name: 'Tỉnh Phú Thọ', codename: 'phu_tho', division_type: 'tỉnh', oldNames: ['Tỉnh Phú Thọ', 'Tỉnh Vĩnh Phúc', 'Tỉnh Hòa Bình'] },
  { name: 'Tỉnh Hưng Yên', codename: 'hung_yen', division_type: 'tỉnh', oldNames: ['Tỉnh Hưng Yên', 'Tỉnh Thái Bình'] },
  { name: 'Tỉnh Ninh Bình', codename: 'ninh_binh', division_type: 'tỉnh', oldNames: ['Tỉnh Ninh Bình', 'Tỉnh Hà Nam', 'Tỉnh Nam Định'] },
  { name: 'Tỉnh Thanh Hóa', codename: 'thanh_hoa', division_type: 'tỉnh', oldNames: ['Tỉnh Thanh Hóa'] },
  { name: 'Tỉnh Nghệ An', codename: 'nghe_an', division_type: 'tỉnh', oldNames: ['Tỉnh Nghệ An'] },
  { name: 'Tỉnh Hà Tĩnh', codename: 'ha_tinh', division_type: 'tỉnh', oldNames: ['Tỉnh Hà Tĩnh'] },
  { name: 'Tỉnh Quảng Trị', codename: 'quang_tri', division_type: 'tỉnh', oldNames: ['Tỉnh Quảng Trị', 'Tỉnh Quảng Bình'] },
  { name: 'Tỉnh Quảng Ngãi', codename: 'quang_ngai', division_type: 'tỉnh', oldNames: ['Tỉnh Quảng Ngãi', 'Tỉnh Kon Tum'] },
  { name: 'Tỉnh Gia Lai', codename: 'gia_lai', division_type: 'tỉnh', oldNames: ['Tỉnh Gia Lai', 'Tỉnh Bình Định'] },
  { name: 'Tỉnh Đắk Lắk', codename: 'dak_lak', division_type: 'tỉnh', oldNames: ['Tỉnh Đắk Lắk', 'Tỉnh Phú Yên'] },
  { name: 'Tỉnh Khánh Hòa', codename: 'khanh_hoa', division_type: 'tỉnh', oldNames: ['Tỉnh Khánh Hòa', 'Tỉnh Ninh Thuận'] },
  { name: 'Tỉnh Lâm Đồng', codename: 'lam_dong', division_type: 'tỉnh', oldNames: ['Tỉnh Lâm Đồng', 'Tỉnh Đắk Nông', 'Tỉnh Bình Thuận'] },
  { name: 'Tỉnh Đồng Nai', codename: 'dong_nai', division_type: 'tỉnh', oldNames: ['Tỉnh Đồng Nai', 'Tỉnh Bình Phước'] },
  { name: 'Tỉnh Tây Ninh', codename: 'tay_ninh', division_type: 'tỉnh', oldNames: ['Tỉnh Tây Ninh', 'Tỉnh Long An'] },
  { name: 'Tỉnh Đồng Tháp', codename: 'dong_thap', division_type: 'tỉnh', oldNames: ['Tỉnh Đồng Tháp', 'Tỉnh Tiền Giang'] },
  { name: 'Tỉnh An Giang', codename: 'an_giang', division_type: 'tỉnh', oldNames: ['Tỉnh An Giang', 'Tỉnh Kiên Giang'] },
  { name: 'Tỉnh Vĩnh Long', codename: 'vinh_long', division_type: 'tỉnh', oldNames: ['Tỉnh Vĩnh Long', 'Tỉnh Bến Tre', 'Tỉnh Trà Vinh'] },
  { name: 'Tỉnh Cà Mau', codename: 'ca_mau', division_type: 'tỉnh', oldNames: ['Tỉnh Cà Mau', 'Tỉnh Bạc Liêu'] },
];

const normalizeAdministrativeName = (value?: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/^(tinh|thanh pho|tp\.?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const provinceNameLookup = new Map<string, ProvinceGroup>();
CURRENT_PROVINCES.forEach((group) => {
  provinceNameLookup.set(normalizeAdministrativeName(group.name), group);
  group.oldNames.forEach((name) => provinceNameLookup.set(normalizeAdministrativeName(name), group));
});

const emptyProvince = (group: ProvinceGroup, code: number): Province => ({
  name: group.name,
  code,
  division_type: group.division_type,
  codename: group.codename,
  phone_code: 0,
  districts: [],
});

const buildCurrentProvinceTree = (legacyProvinces: Province[]) => {
  const oldProvinceByName = new Map(
    legacyProvinces.map((province) => [normalizeAdministrativeName(province.name), province])
  );

  return CURRENT_PROVINCES.map((group, index) => {
    const mergedSources = group.oldNames
      .map((name) => oldProvinceByName.get(normalizeAdministrativeName(name)))
      .filter(Boolean) as Province[];

    const primary = mergedSources[0];
    const currentCode = primary?.code ?? 900 + index;

    const districts = mergedSources.flatMap((province) =>
      (province.districts || []).map((district) => ({
        ...district,
        province_code: currentCode,
      }))
    );

    return {
      ...emptyProvince(group, currentCode),
      phone_code: primary?.phone_code ?? 0,
      districts,
    };
  });
};

export const getCurrentProvinceName = (name?: string) => {
  const group = provinceNameLookup.get(normalizeAdministrativeName(name));
  return group?.name || name || '';
};

export const normalizeLocationName = (value?: string) =>
  String(value || '').replace(/^(Tỉnh|Thành phố|TP\.?|Quận|Huyện|Thị xã)\s+/i, '').trim();

export const useVietnamLocations = (
  selectedProvinceCode?: number,
  selectedDistrictCode?: number
) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<Province[]>(`${API_BASE_URL}/?depth=3`);
        if (!mounted) return;
        setProvinces(buildCurrentProvinceTree(response.data || []));
      } catch (error) {
        console.error('Không thể tải danh sách tỉnh/thành:', error);
        if (mounted) {
          setProvinces(CURRENT_PROVINCES.map((group, index) => emptyProvince(group, 900 + index)));
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchLocations();

    return () => {
      mounted = false;
    };
  }, []);

  const districts = useMemo(() => {
    if (!selectedProvinceCode) return [];
    return provinces.find((province) => province.code === selectedProvinceCode)?.districts || [];
  }, [provinces, selectedProvinceCode]);

  const wards = useMemo(() => {
    if (!selectedDistrictCode) return [];
    return districts.find((district) => district.code === selectedDistrictCode)?.wards || [];
  }, [districts, selectedDistrictCode]);

  return { provinces, districts, wards, isLoading };
};
