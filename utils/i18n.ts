
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  en: {
    // Home Screen
    home_title: 'TrackMe LK',
    home_subtitle: 'Live GPS Tracking for Sri Lanka',
    personal_safety: 'Personal Safety',
    personal_safety_desc: 'Share your live location with trusted contacts',
    delivery_mode: 'Delivery Mode',
    delivery_mode_desc: 'Track deliveries in real-time',
    
    // Personal Safety
    personal_safety_title: 'Personal Safety',
    start_safe_tracking: 'Start Safe Tracking',
    safe_tracking_desc: 'Share your live location with trusted contacts. Choose how long you want to be tracked.',
    tracking_active: 'Tracking Active',
    tracking_subtitle: 'Your location is being shared',
    tracking_code: 'Tracking Code',
    time_left: 'Time Left',
    battery: 'Battery',
    share_link: 'Share Link',
    whatsapp: 'WhatsApp',
    emergency_sos: 'Emergency SOS',
    stop_tracking: 'Stop Tracking',
    favorite_locations: 'Favorite Locations',
    manage: 'Manage',
    no_favorites: 'No favorite locations saved',
    add_first_favorite: 'Add your first favorite',
    
    // Delivery Mode
    delivery_mode_title: 'Delivery Mode',
    create_delivery_order: 'Create Delivery Order',
    delivery_order_desc: 'Start tracking a delivery. An order ID will be auto-generated.',
    customer_name: 'Customer Name (Optional)',
    enter_customer_name: 'Enter customer name',
    destination_required: 'Destination (Required)',
    select_destination: 'Select destination on map',
    start_delivery: 'Start Delivery',
    delivery_active: 'Delivery Active',
    tracking_in_progress: 'Tracking in progress',
    order_id: 'Order ID',
    customer: 'Customer',
    destination: 'Destination',
    delivery_status: 'Delivery Status',
    pending: 'Pending',
    on_the_way: 'On the Way',
    delivered: 'Delivered',
    current: 'Current',
    share_tracking_link: 'Share Tracking Link',
    stop_delivery: 'Stop Delivery',
    navigate_google_maps: 'Navigate with Google Maps',
    heavy_traffic: 'Heavy Traffic Detected',
    traffic_desc: 'Your current route has heavy traffic. Consider taking an alternative route.',
    shift_route: 'Shift Route',
    
    // Tracking Screen
    live_tracking: 'Live Tracking',
    loading_tracking: 'Loading tracking data...',
    session_not_found: 'Tracking session not found',
    check_code: 'Please check the tracking code and try again',
    last_updated: 'Last updated',
    session_information: 'Session Information',
    type: 'Type',
    personal_safety_type: 'Personal Safety',
    delivery_type: 'Delivery',
    time_remaining: 'Time Remaining',
    live_stats: 'Live Stats',
    speed: 'Speed',
    location_updates: 'location updates recorded',
    
    // Settings/Profile
    settings: 'Settings',
    app_name: 'TrackMe LK',
    version: 'Version 1.0.0',
    language: 'Language',
    select_language: 'Select Language',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',
    legal: 'Legal',
    privacy_policy: 'Privacy Policy',
    terms_of_service: 'Terms of Service',
    app_description: 'TrackMe LK provides real-time GPS tracking for personal safety and delivery services in Sri Lanka.',
    
    // Features
    features: 'Features',
    auto_order_id: 'Auto-generated order ID',
    realtime_gps: 'Real-time GPS tracking',
    google_maps_nav: 'Google Maps navigation',
    traffic_alerts: 'Traffic alerts',
    live_gps_updates: 'Live GPS updates every 5 seconds',
    battery_sharing: 'Battery percentage sharing',
    emergency_sos_feature: 'Emergency SOS button',
    auto_expiry: 'Auto-expiry timer',
    
    // Common
    done: 'Done',
    cancel: 'Cancel',
    error: 'Error',
    success: 'Success',
    loading: 'Loading',
    search: 'Search',
    select: 'Select',
  },
  si: {
    // Home Screen
    home_title: 'TrackMe LK',
    home_subtitle: 'ශ්‍රී ලංකාව සඳහා සජීවී GPS ලුහුබැඳීම',
    personal_safety: 'පුද්ගලික ආරක්ෂාව',
    personal_safety_desc: 'විශ්වාසදායක සම්බන්ධතා සමඟ ඔබේ සජීවී ස්ථානය බෙදා ගන්න',
    delivery_mode: 'බෙදාහැරීමේ මාදිලිය',
    delivery_mode_desc: 'තත්‍ය කාලීනව බෙදාහැරීම් ලුහුබඳින්න',
    
    // Personal Safety
    personal_safety_title: 'පුද්ගලික ආරක්ෂාව',
    start_safe_tracking: 'ආරක්ෂිත ලුහුබැඳීම ආරම්භ කරන්න',
    safe_tracking_desc: 'විශ්වාසදායක සම්බන්ධතා සමඟ ඔබේ සජීවී ස්ථානය බෙදා ගන්න. ඔබට කොපමණ කාලයක් ලුහුබැඳීමට අවශ්‍යද යන්න තෝරන්න.',
    tracking_active: 'ලුහුබැඳීම සක්‍රීයයි',
    tracking_subtitle: 'ඔබේ ස්ථානය බෙදා හරිමින් පවතී',
    tracking_code: 'ලුහුබැඳීමේ කේතය',
    time_left: 'ඉතිරි කාලය',
    battery: 'බැටරිය',
    share_link: 'සබැඳිය බෙදා ගන්න',
    whatsapp: 'WhatsApp',
    emergency_sos: 'හදිසි SOS',
    stop_tracking: 'ලුහුබැඳීම නවත්වන්න',
    favorite_locations: 'ප්‍රියතම ස්ථාන',
    manage: 'කළමනාකරණය',
    no_favorites: 'ප්‍රියතම ස්ථාන සුරකින ලද නැත',
    add_first_favorite: 'ඔබේ පළමු ප්‍රියතමය එක් කරන්න',
    
    // Delivery Mode
    delivery_mode_title: 'බෙදාහැරීමේ මාදිලිය',
    create_delivery_order: 'බෙදාහැරීමේ ඇණවුමක් සාදන්න',
    delivery_order_desc: 'බෙදාහැරීමක් ලුහුබැඳීම ආරම්භ කරන්න. ඇණවුම් හැඳුනුම්පතක් ස්වයංක්‍රීයව ජනනය වේ.',
    customer_name: 'පාරිභෝගික නම (විකල්ප)',
    enter_customer_name: 'පාරිභෝගික නම ඇතුළත් කරන්න',
    destination_required: 'ගමනාන්තය (අවශ්‍ය)',
    select_destination: 'සිතියමේ ගමනාන්තය තෝරන්න',
    start_delivery: 'බෙදාහැරීම ආරම්භ කරන්න',
    delivery_active: 'බෙදාහැරීම සක්‍රීයයි',
    tracking_in_progress: 'ලුහුබැඳීම ක්‍රියාත්මකයි',
    order_id: 'ඇණවුම් හැඳුනුම්පත',
    customer: 'පාරිභෝගිකයා',
    destination: 'ගමනාන්තය',
    delivery_status: 'බෙදාහැරීමේ තත්ත්වය',
    pending: 'පොරොත්තුවෙන්',
    on_the_way: 'මාර්ගයේ',
    delivered: 'බෙදා හැරිණි',
    current: 'වත්මන්',
    share_tracking_link: 'ලුහුබැඳීමේ සබැඳිය බෙදා ගන්න',
    stop_delivery: 'බෙදාහැරීම නවත්වන්න',
    navigate_google_maps: 'Google Maps සමඟ සංචාලනය කරන්න',
    heavy_traffic: 'අධික රථවාහන තදබදයක් අනාවරණය විය',
    traffic_desc: 'ඔබේ වත්මන් මාර්ගයේ අධික රථවාහන තදබදයක් ඇත. විකල්ප මාර්ගයක් ගැනීම සලකා බලන්න.',
    shift_route: 'මාර්ගය වෙනස් කරන්න',
    
    // Tracking Screen
    live_tracking: 'සජීවී ලුහුබැඳීම',
    loading_tracking: 'ලුහුබැඳීමේ දත්ත පූරණය වෙමින්...',
    session_not_found: 'ලුහුබැඳීමේ සැසිය හමු නොවීය',
    check_code: 'කරුණාකර ලුහුබැඳීමේ කේතය පරීක්ෂා කර නැවත උත්සාහ කරන්න',
    last_updated: 'අවසන් වරට යාවත්කාලීන කළේ',
    session_information: 'සැසි තොරතුරු',
    type: 'වර්ගය',
    personal_safety_type: 'පුද්ගලික ආරක්ෂාව',
    delivery_type: 'බෙදාහැරීම',
    time_remaining: 'ඉතිරි කාලය',
    live_stats: 'සජීවී සංඛ්‍යාලේඛන',
    speed: 'වේගය',
    location_updates: 'ස්ථාන යාවත්කාලීන වාර්තා කර ඇත',
    
    // Settings/Profile
    settings: 'සැකසුම්',
    app_name: 'TrackMe LK',
    version: 'අනුවාදය 1.0.0',
    language: 'භාෂාව',
    select_language: 'භාෂාව තෝරන්න',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',
    legal: 'නීතිමය',
    privacy_policy: 'රහස්‍යතා ප්‍රතිපත්තිය',
    terms_of_service: 'සේවා කොන්දේසි',
    app_description: 'TrackMe LK ශ්‍රී ලංකාවේ පුද්ගලික ආරක්ෂාව සහ බෙදාහැරීමේ සේවා සඳහා තත්‍ය කාලීන GPS ලුහුබැඳීම සපයයි.',
    
    // Features
    features: 'විශේෂාංග',
    auto_order_id: 'ස්වයංක්‍රීයව ජනනය කළ ඇණවුම් හැඳුනුම්පත',
    realtime_gps: 'තත්‍ය කාලීන GPS ලුහුබැඳීම',
    google_maps_nav: 'Google Maps සංචාලනය',
    traffic_alerts: 'රථවාහන ඇඟවීම්',
    live_gps_updates: 'සෑම තත්පර 5කට වරක් සජීවී GPS යාවත්කාලීන',
    battery_sharing: 'බැටරි ප්‍රතිශතය බෙදා ගැනීම',
    emergency_sos_feature: 'හදිසි SOS බොත්තම',
    auto_expiry: 'ස්වයංක්‍රීය කල් ඉකුත් වීමේ ටයිමරය',
    
    // Common
    done: 'අවසන්',
    cancel: 'අවලංගු කරන්න',
    error: 'දෝෂයකි',
    success: 'සාර්ථකයි',
    loading: 'පූරණය වෙමින්',
    search: 'සොයන්න',
    select: 'තෝරන්න',
  },
  ta: {
    // Home Screen
    home_title: 'TrackMe LK',
    home_subtitle: 'இலங்கைக்கான நேரடி GPS கண்காணிப்பு',
    personal_safety: 'தனிப்பட்ட பாதுகாப்பு',
    personal_safety_desc: 'நம்பகமான தொடர்புகளுடன் உங்கள் நேரடி இருப்பிடத்தைப் பகிரவும்',
    delivery_mode: 'விநியோக முறை',
    delivery_mode_desc: 'நேரடியாக விநியோகங்களைக் கண்காணிக்கவும்',
    
    // Personal Safety
    personal_safety_title: 'தனிப்பட்ட பாதுகாப்பு',
    start_safe_tracking: 'பாதுகாப்பான கண்காணிப்பைத் தொடங்கவும்',
    safe_tracking_desc: 'நம்பகமான தொடர்புகளுடன் உங்கள் நேரடி இருப்பிடத்தைப் பகிரவும். நீங்கள் எவ்வளவு காலம் கண்காணிக்க விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும்.',
    tracking_active: 'கண்காணிப்பு செயலில் உள்ளது',
    tracking_subtitle: 'உங்கள் இருப்பிடம் பகிரப்படுகிறது',
    tracking_code: 'கண்காணிப்பு குறியீடு',
    time_left: 'மீதமுள்ள நேரம்',
    battery: 'பேட்டரி',
    share_link: 'இணைப்பைப் பகிரவும்',
    whatsapp: 'WhatsApp',
    emergency_sos: 'அவசர SOS',
    stop_tracking: 'கண்காணிப்பை நிறுத்தவும்',
    favorite_locations: 'விருப்பமான இடங்கள்',
    manage: 'நிர்வகிக்கவும்',
    no_favorites: 'விருப்பமான இடங்கள் சேமிக்கப்படவில்லை',
    add_first_favorite: 'உங்கள் முதல் விருப்பத்தைச் சேர்க்கவும்',
    
    // Delivery Mode
    delivery_mode_title: 'விநியோக முறை',
    create_delivery_order: 'விநியோக ஆர்டரை உருவாக்கவும்',
    delivery_order_desc: 'விநியோகத்தைக் கண்காணிக்கத் தொடங்கவும். ஆர்டர் ஐடி தானாக உருவாக்கப்படும்.',
    customer_name: 'வாடிக்கையாளர் பெயர் (விருப்பமானது)',
    enter_customer_name: 'வாடிக்கையாளர் பெயரை உள்ளிடவும்',
    destination_required: 'இலக்கு (தேவை)',
    select_destination: 'வரைபடத்தில் இலக்கைத் தேர்ந்தெடுக்கவும்',
    start_delivery: 'விநியோகத்தைத் தொடங்கவும்',
    delivery_active: 'விநியோகம் செயலில் உள்ளது',
    tracking_in_progress: 'கண்காணிப்பு நடைபெறுகிறது',
    order_id: 'ஆர்டர் ஐடி',
    customer: 'வாடிக்கையாளர்',
    destination: 'இலக்கு',
    delivery_status: 'விநியோக நிலை',
    pending: 'நிலுவையில்',
    on_the_way: 'வழியில்',
    delivered: 'வழங்கப்பட்டது',
    current: 'தற்போதைய',
    share_tracking_link: 'கண்காணிப்பு இணைப்பைப் பகிரவும்',
    stop_delivery: 'விநியோகத்தை நிறுத்தவும்',
    navigate_google_maps: 'Google Maps உடன் வழிசெலுத்தவும்',
    heavy_traffic: 'அதிக போக்குவரத்து கண்டறியப்பட்டது',
    traffic_desc: 'உங்கள் தற்போதைய பாதையில் அதிக போக்குவரத்து உள்ளது. மாற்று பாதையை எடுப்பதைக் கருத்தில் கொள்ளுங்கள்.',
    shift_route: 'பாதையை மாற்றவும்',
    
    // Tracking Screen
    live_tracking: 'நேரடி கண்காணிப்பு',
    loading_tracking: 'கண்காணிப்பு தரவு ஏற்றப்படுகிறது...',
    session_not_found: 'கண்காணிப்பு அமர்வு கிடைக்கவில்லை',
    check_code: 'கண்காணிப்பு குறியீட்டைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்',
    last_updated: 'கடைசியாக புதுப்பிக்கப்பட்டது',
    session_information: 'அமர்வு தகவல்',
    type: 'வகை',
    personal_safety_type: 'தனிப்பட்ட பாதுகாப்பு',
    delivery_type: 'விநியோகம்',
    time_remaining: 'மீதமுள்ள நேரம்',
    live_stats: 'நேரடி புள்ளிவிவரங்கள்',
    speed: 'வேகம்',
    location_updates: 'இருப்பிட புதுப்பிப்புகள் பதிவு செய்யப்பட்டன',
    
    // Settings/Profile
    settings: 'அமைப்புகள்',
    app_name: 'TrackMe LK',
    version: 'பதிப்பு 1.0.0',
    language: 'மொழி',
    select_language: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',
    legal: 'சட்டம்',
    privacy_policy: 'தனியுரிமைக் கொள்கை',
    terms_of_service: 'சேவை விதிமுறைகள்',
    app_description: 'TrackMe LK இலங்கையில் தனிப்பட்ட பாதுகாப்பு மற்றும் விநியோக சேவைகளுக்கான நேரடி GPS கண்காணிப்பை வழங்குகிறது.',
    
    // Features
    features: 'அம்சங்கள்',
    auto_order_id: 'தானாக உருவாக்கப்பட்ட ஆர்டர் ஐடி',
    realtime_gps: 'நேரடி GPS கண்காணிப்பு',
    google_maps_nav: 'Google Maps வழிசெலுத்தல்',
    traffic_alerts: 'போக்குவரத்து எச்சரிக்கைகள்',
    live_gps_updates: 'ஒவ்வொரு 5 வினாடிகளுக்கும் நேரடி GPS புதுப்பிப்புகள்',
    battery_sharing: 'பேட்டரி சதவீதம் பகிர்தல்',
    emergency_sos_feature: 'அவசர SOS பொத்தான்',
    auto_expiry: 'தானாக காலாவதியாகும் டைமர்',
    
    // Common
    done: 'முடிந்தது',
    cancel: 'ரத்துசெய்',
    error: 'பிழை',
    success: 'வெற்றி',
    loading: 'ஏற்றுகிறது',
    search: 'தேடு',
    select: 'தேர்ந்தெடு',
  },
};

const i18n = new I18n(translations);
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

export const LANGUAGE_STORAGE_KEY = '@trackme_language';

export const loadLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      i18n.locale = savedLanguage;
      console.log('Loaded language:', savedLanguage);
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
};

export const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.locale = language;
    console.log('Saved language:', language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export const getCurrentLanguage = () => i18n.locale;

export const t = (key: string, options?: any) => i18n.t(key, options);

export default i18n;
