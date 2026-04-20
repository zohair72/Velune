const hasFractionalValue = (value: number) => Math.abs(value % 1) > 0.000001;

export const formatRupees = (value: number) => {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const showDecimals = hasFractionalValue(normalizedValue);

  return `Rs.${new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(normalizedValue)}`;
};
