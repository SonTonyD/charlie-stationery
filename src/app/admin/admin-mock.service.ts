import { Injectable } from '@angular/core';
import {
  AdminBox,
  AdminBoxImage,
  AdminProduct,
} from './admin.models';
import { supabase } from '../supabase/supabase.client';

interface AdminProductPayload {
  name: string;
  purchaseUnitPrice: number;
  defaultSalePrice: number;
}

interface AdminBoxPayload {
  name: string;
  description: string;
  salePrice: number;
  purchasePrice: number | null;
  imageUrl?: string;
  showOnFrontOffice?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminMockService {
  private readonly defaultProducts: AdminProduct[] = [
    {
      id: 'prd-1',
      name: 'Cahier Pastel',
      purchaseUnitPrice: 2.1,
      defaultSalePrice: 4.5,
      stockQuantity: 14,
    },
    {
      id: 'prd-2',
      name: 'Stylo Gel',
      purchaseUnitPrice: 0.8,
      defaultSalePrice: 2.4,
      stockQuantity: 20,
    },
    {
      id: 'prd-3',
      name: 'Sticker Kawaii',
      purchaseUnitPrice: 0.3,
      defaultSalePrice: 1.2,
      stockQuantity: 40,
    },
    {
      id: 'prd-4',
      name: 'Magnet',
      purchaseUnitPrice: 1.1,
      defaultSalePrice: 2.8,
      stockQuantity: 11,
    },
  ];

  private readonly defaultBoxes: AdminBox[] = [
    {
      id: 'box-1',
      name: 'Box Premium',
      description: 'Selection premium orientee ecriture et deco.',
      imageUrl: '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: true,
      salePrice: 35.1,
      purchasePrice: 15.4,
      stockQuantity: 5,
      items: [
        { productId: 'prd-1', quantity: 3 },
        { productId: 'prd-2', quantity: 5 },
        { productId: 'prd-3', quantity: 1 },
        { productId: 'prd-4', quantity: 3 },
      ],
    },
    {
      id: 'box-2',
      name: 'Box Petite',
      description: 'Format compact pour petits cadeaux du quotidien.',
      imageUrl: '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: false,
      salePrice: 10.8,
      purchasePrice: 4.3,
      stockQuantity: 8,
      items: [
        { productId: 'prd-1', quantity: 1 },
        { productId: 'prd-2', quantity: 2 },
        { productId: 'prd-3', quantity: 2 },
      ],
    },
    {
      id: 'box-3',
      name: 'Box Fashion',
      description: 'Selection tendance orientee accessoires et deco.',
      imageUrl: '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: false,
      salePrice: 18,
      purchasePrice: 8.2,
      stockQuantity: 4,
      items: [
        { productId: 'prd-2', quantity: 3 },
        { productId: 'prd-3', quantity: 4 },
        { productId: 'prd-4', quantity: 2 },
      ],
    },
  ];

  private hasSeeded = false;

  async getProducts() {
    await this.ensureSeedData();

    const { data, error } = await supabase
      .from('products')
      .select('id, name, purchase_unit_price, default_sale_price, stock_quantity')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      purchaseUnitPrice: this.toMoney(Number(product.purchase_unit_price) || 0),
      defaultSalePrice: this.toMoney(Number(product.default_sale_price) || 0),
      stockQuantity: Math.max(0, Math.floor(Number(product.stock_quantity) || 0)),
    }));
  }

  async getBoxes() {
    await this.ensureSeedData();

    const { data, error } = await supabase
      .from('boxes')
      .select(
        'id, name, description, image_url, show_on_front_office, sale_price, purchase_price, stock_quantity, box_images(id, image_url, storage_path, sort_order), box_complete_images(id, image_url, storage_path, sort_order), box_items(product_id, quantity)',
      )
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((box) => {
      const images = this.normalizeBoxImages(box.box_images ?? []);
      const completeImages = this.normalizeBoxImages(
        box.box_complete_images ?? [],
      );
      return {
        id: box.id,
        name: box.name,
        description: box.description ?? '',
        imageUrl: images[0]?.url || box.image_url || '/alien-box.jpeg',
        images,
        completeImages,
        showOnFrontOffice: Boolean(box.show_on_front_office),
        salePrice: this.toMoney(Number(box.sale_price) || 0),
        purchasePrice:
          box.purchase_price === null
            ? null
            : this.toMoney(Number(box.purchase_price) || 0),
        stockQuantity: Math.max(0, Math.floor(Number(box.stock_quantity) || 0)),
        items: (box.box_items ?? []).map((item) => ({
          productId: item.product_id,
          quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        })),
      };
    });
  }

  async createProduct(payload: AdminProductPayload) {
    const product: AdminProduct = {
      id: this.generateId('prd'),
      ...payload,
      stockQuantity: 0,
    };

    const { error } = await supabase.from('products').insert({
      id: product.id,
      name: product.name,
      purchase_unit_price: product.purchaseUnitPrice,
      default_sale_price: product.defaultSalePrice,
      stock_quantity: product.stockQuantity,
    });

    if (error) {
      throw error;
    }

    return { ...product };
  }

  async updateProduct(productId: string, payload: AdminProductPayload) {
    const { error } = await supabase
      .from('products')
      .update({
        name: payload.name,
        purchase_unit_price: payload.purchaseUnitPrice,
        default_sale_price: payload.defaultSalePrice,
      })
      .eq('id', productId);

    if (error) {
      throw error;
    }
  }

  async updateProductStock(productId: string, stockQuantity: number) {
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: stockQuantity })
      .eq('id', productId);

    if (error) {
      throw error;
    }
  }

  async deleteProduct(productId: string) {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      throw error;
    }
  }

  async createBox(payload: AdminBoxPayload) {
    const box: AdminBox = {
      id: this.generateId('box'),
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl || '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: payload.showOnFrontOffice ?? false,
      salePrice: payload.salePrice,
      purchasePrice: payload.purchasePrice,
      stockQuantity: 0,
      items: [],
    };

    const { error } = await supabase.from('boxes').insert({
      id: box.id,
      name: box.name,
      description: box.description,
      image_url: box.imageUrl,
      show_on_front_office: box.showOnFrontOffice,
      sale_price: box.salePrice,
      purchase_price: box.purchasePrice,
      stock_quantity: box.stockQuantity,
    });

    if (error) {
      throw error;
    }

    return { ...box, items: [] };
  }

  async updateBox(
    boxId: string,
    payload: Pick<AdminBox, 'name' | 'description' | 'imageUrl' | 'showOnFrontOffice' | 'salePrice' | 'purchasePrice'>,
  ) {
    const { error } = await supabase
      .from('boxes')
      .update({
        name: payload.name,
        description: payload.description,
        image_url: payload.imageUrl || '/alien-box.jpeg',
        show_on_front_office: payload.showOnFrontOffice,
        sale_price: payload.salePrice,
        purchase_price: payload.purchasePrice,
      })
      .eq('id', boxId);

    if (error) {
      throw error;
    }
  }

  async deleteBox(boxId: string) {
    await this.deleteBoxStorageImages(boxId);
    await this.deleteBoxCompleteStorageImages(boxId);
    const { error } = await supabase.from('boxes').delete().eq('id', boxId);
    if (error) {
      throw error;
    }
  }

  async updateBoxStock(boxId: string, stockQuantity: number) {
    const { error } = await supabase
      .from('boxes')
      .update({ stock_quantity: stockQuantity })
      .eq('id', boxId);

    if (error) {
      throw error;
    }
  }

  async uploadBoxImages(boxId: string, files: File[]) {
    if (files.length === 0) {
      return;
    }

    const existingImages = await this.getBoxImages(boxId);
    let nextSortOrder =
      existingImages.length === 0
        ? 0
        : Math.max(...existingImages.map((image) => image.sortOrder)) + 1;
    const uploadedImages: AdminBoxImage[] = [];

    for (const file of files) {
      const storagePath = this.createBoxImageStoragePath(boxId, file);
      const { error: uploadError } = await supabase.storage
        .from('box-images')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('box-images').getPublicUrl(storagePath);

      const image: AdminBoxImage = {
        id: this.generateId('img'),
        url: publicUrl,
        storagePath,
        sortOrder: nextSortOrder,
      };
      nextSortOrder += 1;
      uploadedImages.push(image);
    }

    const { error } = await supabase.from('box_images').insert(
      uploadedImages.map((image) => ({
        id: image.id,
        box_id: boxId,
        image_url: image.url,
        storage_path: image.storagePath,
        sort_order: image.sortOrder,
      })),
    );

    if (error) {
      throw error;
    }

    await this.syncBoxPrimaryImage(boxId);
  }

  async updateBoxImagesOrder(boxId: string, images: AdminBoxImage[]) {
    const orderedImages = images.map((image, index) => ({
      ...image,
      sortOrder: index,
    }));

    const { error } = await supabase.from('box_images').upsert(
      orderedImages.map((image) => ({
        id: image.id,
        box_id: boxId,
        image_url: image.url,
        storage_path: image.storagePath,
        sort_order: image.sortOrder,
      })),
    );

    if (error) {
      throw error;
    }

    await this.syncBoxPrimaryImage(boxId);
  }

  async deleteBoxImage(boxId: string, image: AdminBoxImage) {
    if (image.storagePath) {
      const { error: storageError } = await supabase.storage
        .from('box-images')
        .remove([image.storagePath]);

      if (storageError) {
        throw storageError;
      }
    }

    const { error } = await supabase
      .from('box_images')
      .delete()
      .eq('id', image.id);

    if (error) {
      throw error;
    }

    await this.reindexBoxImages(boxId);
    await this.syncBoxPrimaryImage(boxId);
  }

  async uploadBoxCompleteImages(boxId: string, files: File[]) {
    if (files.length === 0) return;

    const existingImages = await this.getBoxCompleteImages(boxId);
    let nextSortOrder = existingImages.length
      ? Math.max(...existingImages.map((image) => image.sortOrder)) + 1
      : 0;
    const uploadedImages: AdminBoxImage[] = [];

    for (const file of files) {
      const storagePath = this.createBoxImageStoragePath(boxId, file, 'complete');
      const { error: uploadError } = await supabase.storage
        .from('box-images')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('box-images')
        .getPublicUrl(storagePath);
      uploadedImages.push({
        id: this.generateId('complete-img'),
        url: publicUrl,
        storagePath,
        sortOrder: nextSortOrder++,
      });
    }

    const { error } = await supabase.from('box_complete_images').insert(
      uploadedImages.map((image) => ({
        id: image.id,
        box_id: boxId,
        image_url: image.url,
        storage_path: image.storagePath,
        sort_order: image.sortOrder,
      })),
    );
    if (error) throw error;
  }

  async updateBoxCompleteImagesOrder(boxId: string, images: AdminBoxImage[]) {
    const { error } = await supabase.from('box_complete_images').upsert(
      images.map((image, sortOrder) => ({
        id: image.id,
        box_id: boxId,
        image_url: image.url,
        storage_path: image.storagePath,
        sort_order: sortOrder,
      })),
    );
    if (error) throw error;
  }

  async deleteBoxCompleteImage(boxId: string, image: AdminBoxImage) {
    if (image.storagePath) {
      const { error } = await supabase.storage
        .from('box-images')
        .remove([image.storagePath]);
      if (error) throw error;
    }
    const { error } = await supabase
      .from('box_complete_images')
      .delete()
      .eq('id', image.id);
    if (error) throw error;

    const remainingImages = await this.getBoxCompleteImages(boxId);
    if (remainingImages.length) {
      await this.updateBoxCompleteImagesOrder(boxId, remainingImages);
    }
  }

  async addProductToBox(boxId: string, productId: string) {
    const products = await this.getProducts();
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('box_items')
      .select('quantity')
      .eq('box_id', boxId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      const { error } = await supabase
        .from('box_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('box_id', boxId)
        .eq('product_id', productId);

      if (error) {
        throw error;
      }
      return;
    }

    const { error } = await supabase.from('box_items').insert({
      box_id: boxId,
      product_id: productId,
      quantity: 1,
      sale_price: 0,
    });

    if (error) {
      throw error;
    }
  }

  async updateBoxItem(
    boxId: string,
    productId: string,
    payload: { quantity?: number },
  ) {
    const updatePayload: { quantity?: number } = {};
    if (typeof payload.quantity === 'number') {
      updatePayload.quantity = payload.quantity;
    }

    const { error } = await supabase
      .from('box_items')
      .update(updatePayload)
      .eq('box_id', boxId)
      .eq('product_id', productId);

    if (error) {
      throw error;
    }
  }

  async removeProductFromBox(boxId: string, productId: string) {
    const { error } = await supabase
      .from('box_items')
      .delete()
      .eq('box_id', boxId)
      .eq('product_id', productId);

    if (error) {
      throw error;
    }
  }

  private generateId(prefix: string) {
    if ('randomUUID' in crypto) {
      return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    }
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private normalizeBoxImages(
    images: {
      id: string;
      image_url: string;
      storage_path: string;
      sort_order: number;
    }[],
  ) {
    return images
      .map((image) => ({
        id: image.id,
        url: image.image_url,
        storagePath: image.storage_path,
        sortOrder: Math.max(0, Math.floor(Number(image.sort_order) || 0)),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private async getBoxImages(boxId: string) {
    const { data, error } = await supabase
      .from('box_images')
      .select('id, image_url, storage_path, sort_order')
      .eq('box_id', boxId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return this.normalizeBoxImages(data ?? []);
  }

  private async getBoxCompleteImages(boxId: string) {
    const { data, error } = await supabase
      .from('box_complete_images')
      .select('id, image_url, storage_path, sort_order')
      .eq('box_id', boxId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return this.normalizeBoxImages(data ?? []);
  }

  private async syncBoxPrimaryImage(boxId: string) {
    const images = await this.getBoxImages(boxId);
    const imageUrl = images[0]?.url || '/alien-box.jpeg';
    const { error } = await supabase
      .from('boxes')
      .update({ image_url: imageUrl })
      .eq('id', boxId);

    if (error) {
      throw error;
    }
  }

  private async reindexBoxImages(boxId: string) {
    const images = await this.getBoxImages(boxId);
    if (images.length === 0) {
      return;
    }

    await this.updateBoxImagesOrder(boxId, images);
  }

  private async deleteBoxStorageImages(boxId: string) {
    const images = await this.getBoxImages(boxId);
    const storagePaths = images
      .map((image) => image.storagePath)
      .filter((path) => !!path);

    if (storagePaths.length === 0) {
      return;
    }

    const { error } = await supabase.storage
      .from('box-images')
      .remove(storagePaths);

    if (error) {
      throw error;
    }
  }

  private async deleteBoxCompleteStorageImages(boxId: string) {
    const images = await this.getBoxCompleteImages(boxId);
    const storagePaths = images.map((image) => image.storagePath).filter(Boolean);
    if (!storagePaths.length) return;
    const { error } = await supabase.storage.from('box-images').remove(storagePaths);
    if (error) throw error;
  }

  private createBoxImageStoragePath(
    boxId: string,
    file: File,
    category: 'gallery' | 'complete' = 'gallery',
  ) {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
    return `boxes/${boxId}/${category}/${Date.now()}-${this.generateId('upload')}.${safeExtension}`;
  }

  private async ensureSeedData() {
    if (this.hasSeeded) {
      return;
    }

    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    if ((count ?? 0) > 0) {
      this.hasSeeded = true;
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return;
    }

    const { error: productsError } = await supabase.from('products').insert(
      this.defaultProducts.map((product) => ({
        id: product.id,
        name: product.name,
        purchase_unit_price: product.purchaseUnitPrice,
        default_sale_price: product.defaultSalePrice,
        stock_quantity: product.stockQuantity,
      })),
    );

    if (productsError) {
      throw productsError;
    }

    const { error: boxesError } = await supabase.from('boxes').insert(
      this.defaultBoxes.map((box) => ({
        id: box.id,
        name: box.name,
        description: box.description,
        image_url: box.imageUrl,
        show_on_front_office: box.showOnFrontOffice,
        sale_price: box.salePrice,
        purchase_price: box.purchasePrice,
        stock_quantity: box.stockQuantity,
      })),
    );

    if (boxesError) {
      throw boxesError;
    }

    const { error: boxItemsError } = await supabase.from('box_items').insert(
      this.defaultBoxes.flatMap((box) =>
        box.items.map((item) => ({
          box_id: box.id,
          product_id: item.productId,
          quantity: item.quantity,
          sale_price: 0,
        })),
      ),
    );

    if (boxItemsError) {
      throw boxItemsError;
    }

    this.hasSeeded = true;
  }

  private toMoney(value: number) {
    return Number(value.toFixed(2));
  }
}
