export interface AdminProduct {
  id: string;
  name: string;
  purchaseUnitPrice: number;
  defaultSalePrice: number;
}

export interface BoxProductLine {
  productId: string;
  quantity: number;
  salePrice: number;
}

export interface AdminBox {
  id: string;
  name: string;
  description: string;
  items: BoxProductLine[];
}
