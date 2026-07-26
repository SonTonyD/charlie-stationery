import { Injectable } from '@angular/core';
import {
  AdminOrder,
  OrderStatus,
  AdminBox,
  AdminBoxImage,
  AdminProduct,
  ShippingRate,
  AdminReview,
  BoxCollection,
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
  technicalDescription: string;
  salePrice: number;
  purchasePrice: number | null;
  weightGrams: number;
  hasVariants?: boolean;
  isPremium?: boolean;
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
      technicalDescription: '',
      imageUrl: '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: true,
      salePrice: 35.1,
      purchasePrice: 15.4,
      weightGrams: 1000,
      hasVariants: false,
      isPremium: false,
      variants: [],
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
      technicalDescription: '',
      imageUrl: '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: false,
      salePrice: 10.8,
      purchasePrice: 4.3,
      weightGrams: 500,
      hasVariants: false,
      isPremium: false,
      variants: [],
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
      technicalDescription: '',
      imageUrl: '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: false,
      salePrice: 18,
      purchasePrice: 8.2,
      weightGrams: 750,
      hasVariants: false,
      isPremium: false,
      variants: [],
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
        'id, name, description, technical_description, image_url, show_on_front_office, sale_price, purchase_price, weight_grams, has_variants, is_premium, stock_quantity, box_images(id, image_url, storage_path, sort_order), box_complete_images(id, image_url, storage_path, sort_order), box_items(product_id, quantity), box_variants(id, name, price, sort_order)',
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
        technicalDescription: box.technical_description ?? '',
        imageUrl: images[0]?.url || box.image_url || '/alien-box.jpeg',
        images,
        completeImages,
        showOnFrontOffice: Boolean(box.show_on_front_office),
        salePrice: this.toMoney(Number(box.sale_price) || 0),
        purchasePrice:
          box.purchase_price === null
            ? null
            : this.toMoney(Number(box.purchase_price) || 0),
        weightGrams: Math.max(1, Math.floor(Number(box.weight_grams) || 1)),
        hasVariants: Boolean(box.has_variants),
        isPremium: Boolean(box.is_premium),
        variants: (box.box_variants ?? [])
          .map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: this.toMoney(Number(variant.price)),
            sortOrder: Math.max(0, Math.floor(Number(variant.sort_order) || 0)),
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder),
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
      technicalDescription: payload.technicalDescription,
      imageUrl: payload.imageUrl || '/alien-box.jpeg',
      images: [],
      completeImages: [],
      showOnFrontOffice: payload.showOnFrontOffice ?? false,
      salePrice: payload.salePrice,
      purchasePrice: payload.purchasePrice,
      weightGrams: payload.weightGrams,
      hasVariants: payload.hasVariants ?? false,
      isPremium: payload.isPremium ?? false,
      variants: [],
      stockQuantity: 0,
      items: [],
    };

    const { error } = await supabase.from('boxes').insert({
      id: box.id,
      name: box.name,
      description: box.description,
      technical_description: box.technicalDescription,
      image_url: box.imageUrl,
      show_on_front_office: box.showOnFrontOffice,
      sale_price: box.salePrice,
      purchase_price: box.purchasePrice,
      weight_grams: box.weightGrams,
      has_variants: box.hasVariants,
      is_premium: box.isPremium,
      stock_quantity: box.stockQuantity,
    });

    if (error) {
      throw error;
    }

    return { ...box, items: [] };
  }

  async updateBox(
    boxId: string,
    payload: Pick<AdminBox, 'name' | 'description' | 'technicalDescription' | 'imageUrl' | 'showOnFrontOffice' | 'salePrice' | 'purchasePrice' | 'weightGrams' | 'hasVariants' | 'isPremium'>,
  ) {
    const { error } = await supabase
      .from('boxes')
      .update({
        name: payload.name,
        description: payload.description,
        technical_description: payload.technicalDescription,
        image_url: payload.imageUrl || '/alien-box.jpeg',
        show_on_front_office: payload.showOnFrontOffice,
        sale_price: payload.salePrice,
        purchase_price: payload.purchasePrice,
        weight_grams: payload.weightGrams,
        has_variants: payload.hasVariants,
        is_premium: payload.isPremium,
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

  async getOrders(): Promise<AdminOrder[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((order) => ({
      id: order.id,
      stripeSessionId: order.stripe_session_id,
      status: order.status as OrderStatus,
      customerName: `${order.customer_first_name} ${order.customer_last_name}`.trim(),
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      deliveryMethod: order.delivery_method,
      deliveryCarrier: order.delivery_carrier,
      deliveryMode: order.delivery_mode,
      deliveryPrice: this.toMoney(Number(order.delivery_price) || 0),
      deliveryAddress: order.delivery_address,
      deliveryPostalCode: order.delivery_postal_code,
      deliveryCity: order.delivery_city,
      relayPoint: order.relay_point,
      items: Array.isArray(order.items) ? order.items : [],
      itemsTotal: this.toMoney(Number(order.items_total) || 0),
      total: this.toMoney(Number(order.total) || 0),
      createdAt: order.created_at,
    }));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
  }

  async getShippingRates(): Promise<ShippingRate[]> {
    const { data, error } = await supabase
      .from('shipping_rates')
      .select('id, carrier, delivery_mode, weight_min_grams, weight_max_grams, price')
      .order('carrier')
      .order('delivery_mode')
      .order('weight_min_grams');
    if (error) throw error;
    return (data ?? []).map((rate) => ({
      id: rate.id,
      carrier: rate.carrier,
      deliveryMode: rate.delivery_mode,
      weightMinGrams: rate.weight_min_grams,
      weightMaxGrams: rate.weight_max_grams,
      price: this.toMoney(Number(rate.price)),
    }));
  }

  async createBoxVariant(boxId: string, name: string, price: number) {
    const { count } = await supabase
      .from('box_variants')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', boxId);
    const { error } = await supabase.from('box_variants').insert({
      box_id: boxId,
      name,
      price,
      sort_order: count ?? 0,
    });
    if (error) throw error;
  }

  async updateBoxVariant(variantId: string, name: string, price: number) {
    const { error } = await supabase
      .from('box_variants')
      .update({ name, price })
      .eq('id', variantId);
    if (error) throw error;
  }

  async deleteBoxVariant(variantId: string) {
    const { error } = await supabase.from('box_variants').delete().eq('id', variantId);
    if (error) throw error;
  }

  async getReviews(): Promise<AdminReview[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, first_name, last_name, email, rating, comment, is_published, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((review) => ({
      id: review.id,
      firstName: review.first_name,
      lastName: review.last_name,
      email: review.email,
      rating: Number(review.rating),
      comment: review.comment,
      isPublished: Boolean(review.is_published),
      createdAt: review.created_at,
    }));
  }

  async getCollections(): Promise<BoxCollection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, description, image_url, image_storage_path, collection_boxes(box_id)')
      .order('name');
    if (error) throw error;
    return (data ?? []).map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description ?? '',
      imageUrl: collection.image_url ?? null,
      imageStoragePath: collection.image_storage_path ?? null,
      boxIds: (collection.collection_boxes ?? []).map((entry) => entry.box_id),
    }));
  }

  async createCollection(name: string, description: string) {
    const { data, error } = await supabase
      .from('collections')
      .insert({ name, description })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async updateCollection(collectionId: string, name: string, description: string) {
    const { error } = await supabase
      .from('collections')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', collectionId);
    if (error) throw error;
  }

  async deleteCollection(collectionId: string, imageStoragePath?: string | null) {
    const { error } = await supabase.from('collections').delete().eq('id', collectionId);
    if (error) throw error;
    if (imageStoragePath) {
      const { error: storageError } = await supabase.storage
        .from('box-images')
        .remove([imageStoragePath]);
      if (storageError) throw storageError;
    }
  }

  async addBoxToCollection(collectionId: string, boxId: string) {
    const { error } = await supabase
      .from('collection_boxes')
      .insert({ collection_id: collectionId, box_id: boxId });
    if (error) throw error;
  }

  async removeBoxFromCollection(collectionId: string, boxId: string) {
    const { error } = await supabase
      .from('collection_boxes')
      .delete()
      .eq('collection_id', collectionId)
      .eq('box_id', boxId);
    if (error) throw error;
  }

  async uploadCollectionImage(
    collectionId: string,
    file: File,
    previousStoragePath?: string | null,
  ) {
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const storagePath = `collections/${collectionId}/${Date.now()}-${this.generateId('cover')}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('box-images')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('box-images')
      .getPublicUrl(storagePath);
    const { error } = await supabase
      .from('collections')
      .update({
        image_url: publicUrl,
        image_storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectionId);
    if (error) throw error;

    if (previousStoragePath && previousStoragePath !== storagePath) {
      const { error: removeError } = await supabase.storage
        .from('box-images')
        .remove([previousStoragePath]);
      if (removeError) throw removeError;
    }
  }

  async updateReviewPublication(reviewId: string, isPublished: boolean) {
    const { error } = await supabase
      .from('reviews')
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq('id', reviewId);
    if (error) throw error;
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
        technical_description: box.technicalDescription,
        image_url: box.imageUrl,
        show_on_front_office: box.showOnFrontOffice,
        sale_price: box.salePrice,
        purchase_price: box.purchasePrice,
        weight_grams: box.weightGrams,
        has_variants: box.hasVariants,
        is_premium: box.isPremium,
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
