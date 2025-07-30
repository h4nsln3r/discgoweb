export type CourseData = {
  created_by?: string | null;
  id?: string;
  image_urls: string[]; // nu är det alltid en array i komponenterna
  location: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  main_image_url: string | null;
  name: string;
};
