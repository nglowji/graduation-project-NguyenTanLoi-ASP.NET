type AddressLike =
  | string
  | null
  | undefined
  | {
      street?: string | null;
      ward?: string | null;
      district?: string | null;
      city?: string | null;
      fullAddress?: string | null;
    };

const normalizeAddressPart = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '');

export const formatCompactAddress = (address: AddressLike, fallback = 'Chưa cập nhật địa chỉ') => {
  const rawParts = typeof address === 'string'
    ? address.split(',')
    : [
        address?.street,
        address?.ward,
        address?.district,
        address?.city,
      ];

  const fullAddressParts = typeof address === 'string'
    ? []
    : address?.fullAddress?.split(',') || [];

  const seen = new Set<string>();
  const parts = [...rawParts, ...fullAddressParts]
    .filter((part): part is string => Boolean(part && part.trim()))
    .map(normalizeAddressPart)
    .filter((part) => {
      const key = part.toLocaleLowerCase('vi-VN');
      if (!part || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return parts.length > 0 ? parts.join(', ') : fallback;
};
