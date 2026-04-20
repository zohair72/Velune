export type ProductNoteValue = string[] | string | null;

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  notes: string[];
  price: number;
  stockQuantity: number;
  isActive: boolean;
  imagePath: string | null;
  imageUrl: string;
  volumeMl: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  shortDescription: string;
  notes: string;
  price: string;
  stockQuantity: string;
  isActive: boolean;
  volumeMl: string;
};

export type ProductFormErrors = Partial<Record<keyof ProductFormValues | "image", string>>;
