import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../config/supabaseClient";

export const fetchInventory = createAsyncThunk(
  "inventory/fetch",
  async (_, { getState, rejectWithValue }) => {
    const { user } = getState().auth;

    if (!user || !user.id) {
      return rejectWithValue("User not authenticated");
    }

    try {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("dealer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const addCar = createAsyncThunk(
  "inventory/add",
  async (
    { formData, specsList, photos, model3dFile, image360File },
    { getState, rejectWithValue },
  ) => {
    const { user } = getState().auth;
    console.log("🚨 ATTEMPTING SAVE");
    console.log("User Object:", user);
    console.log("User ID:", user?.id);

    if (!user || !user.id) {
      console.error("❌ No User ID found in Redux!");
      return rejectWithValue("User not authenticated or ID missing");
    }

    try {
      const photoUrls = [];

      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split(".").pop();
          const filePath = `${user.id}/${formData.vin}/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("car_photos")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("car_photos").getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }
      }

      let model3dUrl = null;
      if (model3dFile) {
        const fileExt = model3dFile.name.split(".").pop();
        const filePath = `${user.id}/${formData.vin}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("3d_cars")
          .upload(filePath, model3dFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("3d_cars").getPublicUrl(filePath);

        model3dUrl = publicUrl;
      }

      let image360Url = null;
      if (image360File) {
        const fileExt = image360File.name.split(".").pop();
        const filePath = `${user.id}/${formData.vin}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("360_cars")
          .upload(filePath, image360File);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("360_cars").getPublicUrl(filePath);

        image360Url = publicUrl;
      }

      const technicalData = specsList.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      const newCar = {
        dealer_id: user.id,
        vin: formData.vin,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year) || 2024,
        trim: formData.trim,
        price: parseFloat(formData.price) || 0,
        mileage: parseInt(formData.mileage) || 0,
        currency: formData.currency,
        photos: photoUrls || [],
        status: "draft",

        color: formData.color,
        condition: formData.condition,

        model_3d_url: model3dUrl,
        image_360_url: image360Url,

        specs_raw: {
          ...technicalData,
          color_name: formData.color,
          condition: formData.condition,
        },
      };

      console.log("📦 Payload sending to Supabase:", newCar);

      const { data, error } = await supabase
        .from("cars")
        .insert(newCar)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Add Car Failed:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const deleteCar = createAsyncThunk(
  "inventory/delete",
  async (carId, { rejectWithValue }) => {
    try {
      const { error } = await supabase.from("cars").delete().eq("id", carId);

      if (error) throw error;
      return carId; // Return ID to remove from local state
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateCar = createAsyncThunk(
  "inventory/update",
  async (
    {
      carId,
      formData,
      specsList,
      photos,
      existingPhotos,
      model3dFile,
      image360File,
      existing3dUrl,
      existing360Url,
    },
    { getState, rejectWithValue },
  ) => {
    const { user } = getState().auth;
    if (!user) return rejectWithValue("User not authenticated");

    try {
      const newPhotoUrls = [];
      if (photos && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split(".").pop();
          const filePath = `${user.id}/${formData.vin}/${Date.now()}_new_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("car_photos")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("car_photos").getPublicUrl(filePath);

          newPhotoUrls.push(publicUrl);
        }
      }

      const finalPhotoArray = [...(existingPhotos || []), ...newPhotoUrls];

      let model3dUrl = existing3dUrl || null;
      if (model3dFile) {
        const fileExt = model3dFile.name.split(".").pop();
        const filePath = `${user.id}/${formData.vin}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("3d_cars")
          .upload(filePath, model3dFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("3d_cars").getPublicUrl(filePath);

        model3dUrl = publicUrl;
      }

      let image360Url = existing360Url || null;
      if (image360File) {
        const fileExt = image360File.name.split(".").pop();
        const filePath = `${user.id}/${formData.vin}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("360_cars")
          .upload(filePath, image360File);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("360_cars").getPublicUrl(filePath);

        image360Url = publicUrl;
      }

      const technicalData = specsList.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      const updates = {
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        trim: formData.trim,
        price: parseFloat(formData.price) || 0,
        mileage: parseInt(formData.mileage) || 0,

        condition: formData.condition,
        color: formData.color,

        photos: finalPhotoArray,
        model_3d_url: model3dUrl,
        image_360_url: image360Url,
        specs_raw: {
          ...technicalData,
          color_name: formData.color,
          condition: formData.condition,
        },
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("cars")
        .update(updates)
        .eq("id", carId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  list: [],
  loading: false,
  uploading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchInventory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchInventory.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchInventory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(addCar.pending, (state) => {
      state.uploading = true;
      state.error = null;
    });
    builder.addCase(addCar.fulfilled, (state, action) => {
      state.uploading = false;
      state.list.unshift(action.payload);
    });
    builder.addCase(addCar.rejected, (state, action) => {
      state.uploading = false;
      state.error = action.payload;
    });
    // Delete
    builder.addCase(deleteCar.fulfilled, (state, action) => {
      state.list = state.list.filter((car) => car.id !== action.payload);
    });
    builder.addCase(updateCar.fulfilled, (state, action) => {
      const index = state.list.findIndex((car) => car.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
      state.uploading = false;
    });
    builder.addCase(updateCar.pending, (state) => {
      state.uploading = true;
    });
    builder.addCase(updateCar.rejected, (state) => {
      state.uploading = false;
    });
  },
});

export default inventorySlice.reducer;
