// Validation functions as standalone utilities
function validateId(value) {
    return (typeof value === 'number' && value > 0) ? value : 0;
  }
  
  function validateNumber(value) {
    return (typeof value === 'number') ? value : 0;
  }
  
  function validateString(value) {
    return (typeof value === 'string') ? value : "N/A";
  }
  
  function validateBoolean(value) {
    return (typeof value === 'boolean') ? value : false;
  }
  
  function validateUrl(value) {
    try {
      new URL(value);
      return value;
    } catch (error) {
      return "N/A";
    }
  }
  
  function parseDate(value) {
    const parsedDate = new Date(value);
    return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
  }
  
  // Classes using external validation functions
  class VintedPhoto {
    constructor(photo) {
      this.id = validateId(photo.id);
      this.imageNo = validateNumber(photo.image_no);
      this.width = validateNumber(photo.width);
      this.height = validateNumber(photo.height);
      this.url = validateUrl(photo.url);
      this.dominantColor = validateString(photo.dominant_color);
      this.fullSizeUrl = validateUrl(photo.full_size_url);
    }
  }

  class VintedUser {
    constructor(userData) {
        this.id = validateId(userData.id);
        this.login = validateString(userData.login);
        this.feedback_reputation = validateNumber(userData.feedback_reputation)
        this.feedback_count = validateNumber(userData.feedback_count)
        this.countryCode = validateString(userData.country_code).toLowerCase();

        this.photo = userData.photo ? new VintedPhoto(userData.photo) : "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"

        this.url = validateUrl(userData.profile_url);
    }
}
  
  class VintedItem {
    constructor(itemData) {
      this.id = validateId(itemData.id);
      this.title = validateString(itemData.title);
      this.url = validateUrl(itemData.url);
      this.brandId = validateId(itemData.brand_id);
      this.sizeId = validateId(itemData.size_id);
      this.statusId = validateId(itemData.status_id);
      this.userId = validateId(itemData.user_id);

      if (itemData.item_attributes?.length > 0 && itemData.item_attributes[0].code === "video_game_platform") {
        this.videoGamePlatformId = validateId(itemData.item_attributes[0].ids?.[0]);
      }

      this.countryId = validateId(itemData.country_id);
      this.catalogId = validateId(itemData.catalog_id);

      this.description = validateString(itemData.description);
      this.size = validateString(itemData.size);
      this.brand = validateString(itemData.brand);
      this.composition = validateString(itemData.composition);
      this.status = validateString(itemData.status);
      this.label = validateString(itemData.label);
      this.currency = validateString(itemData.currency);
      this.priceNumeric = validateNumber(parseFloat(itemData.price_numeric));

      this.updatedAtTs = parseDate(itemData.updated_at_ts);
      this.colorId = validateId(itemData.color1_id);

      // <t:${Math.floor(Date.now() / 1000)}:R>
      this.unixUpdatedAt = Math.floor(this.updatedAtTs.getTime() / 1000); 
      this.unixUpdatedAtString = `<t:${this.unixUpdatedAt}:R>`;
  
      // Create photo objects
      this.photos = itemData.photos ? itemData.photos.map(photo => new VintedPhoto(photo)) : [];

      // Create user object
      this.user = itemData.user ? new VintedUser(itemData.user) : null;

      this.catalogBranchTitle = validateString(itemData.catalog_branch_title);
    }

    getNumericStars() {
      return this.user ? this.user.feedback_reputation : 0;
    }

    getDominantColor() {
      if (this.photos.length === 0) {
        return "#000000";
      }
      return this.photos[0].dominantColor;
    }
  }
  
  export { VintedItem, VintedPhoto };
  