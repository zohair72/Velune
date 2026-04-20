export const generateOrderNumber = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const randomSegment = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `VLN-${year}${month}${day}-${randomSegment}`;
};
