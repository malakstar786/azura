import { useTranslation } from "@/i18n/useTranslation";
import { theme } from "@/theme";
import DrawerMenu from "@components/DrawerMenu";
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from "@store/language-store";
import { NETWORK_ERROR_CODES } from "@utils/api-config";
import { publicApi } from "@utils/api-service";
import { getFlexDirection } from '@utils/rtlStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlexAlignType, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface SliderBlock {
  image: string;
  title: string;
  titlecolor: string;
  subtitle: string;
  subtitlecolor: string;
  subtitlebgcolor: string;
  desc: string;
  desccolor: string;
  textalignment: string;
  textposition: string;
  mobiletextalignment: string;
  mobiletextposition: string;
  btntext: string;
  link: string;
  imagehover: string;
}

interface FeaturesBlock {
  ishi_randomnumer: string;
  scale: string;
  bgcolor: string;
  heading: string;
  text_align: string;
  subtitle: string;
  desc: string;
  btntext: string;
  btnlink: string;
  image: string;
}

interface ServiceBlock {
  heading_text: string;
  class: string;
  ishiservices: {
    image: string;
    title: string;
    desc: string;
  }[];
}

interface SliderResponse {
  success: number;
  error: string[];
  data: {
    ishiservices: SliderBlock[];
  };
}

interface FeaturesResponse {
  success: number;
  error: string[];
  data: FeaturesBlock;
}

// Update the category mapping
const CATEGORY_MAP = {
  'nail-care': { id: '20', name: 'Nail Care' },
  'perfumes': { id: '57', name: 'Fragrance' },
  'makeup': { id: '18', name: 'Makeup' }
};

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [sliderData, setSliderData] = useState<SliderBlock | null>(null);
  const [featureBlocks, setFeatureBlocks] = useState<{
    block1: FeaturesBlock | null;
    block2: FeaturesBlock | null;
    block3: FeaturesBlock | null;
    block4: FeaturesBlock | null;
    block5: FeaturesBlock | null;
  }>({
    block1: null,
    block2: null,
    block3: null,
    block4: null,
    block5: null
  });
  const [serviceData, setServiceData] = useState<ServiceBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const router = useRouter();
  const { currentLanguage, lastUpdated } = useLanguageStore();
  const { t } = useTranslation();

  const getErrorMessage = (error: any) => {
    if (error.code === NETWORK_ERROR_CODES.NO_CONNECTION) {
      return t('error.noConnection');
    } else if (error.code === NETWORK_ERROR_CODES.TIMEOUT) {
      return t('error.timeout');
    } else if (error.code === NETWORK_ERROR_CODES.SERVER_ERROR) {
      return t('error.serverError');
    }
    return t('error.generic');
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch slider block data using publicApi
        const sliderResponse = await publicApi.getHomeSliderBlock();
        if (sliderResponse.success === 1 && sliderResponse.data.ishiservices.length > 0) {
          setSliderData(sliderResponse.data.ishiservices[0]);
        }

        // Fetch all feature blocks in parallel using publicApi
        const [block1Data, block2Data, block3Data, block4Data, block5Data] = await Promise.all([
          publicApi.getFeaturesBlock(1),
          publicApi.getFeaturesBlock(2),
          publicApi.getFeaturesBlock(3),
          publicApi.getFeaturesBlock(4),
          publicApi.getFeaturesBlock(5)
        ]);

        setFeatureBlocks({
          block1: block1Data.success === 1 ? block1Data.data : null,
          block2: block2Data.success === 1 ? block2Data.data : null,
          block3: block3Data.success === 1 ? block3Data.data : null,
          block4: block4Data.success === 1 ? block4Data.data : null,
          block5: block5Data.success === 1 ? block5Data.data : null,
        });

        // Fetch service block data
        const serviceResponse = await publicApi.getHomeServiceBlock();
        if (serviceResponse.success === 1 && serviceResponse.data) {
          setServiceData(serviceResponse.data);
        }

      } catch (err) {
        console.error('Error fetching home data:', err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [currentLanguage, lastUpdated]);

  const handleExplorePress = (category: string) => {
    // For fragrance blocks, always use 'perfumes' as the slug
    const slug = category === 'fragrance' ? 'perfumes' : category;
    router.push(`/categories/${slug}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.black} />
      </View>
    );
  }

  if (error || !sliderData || !featureBlocks.block1 || !featureBlocks.block2 || 
      !featureBlocks.block3 || !featureBlocks.block4 || !featureBlocks.block5) {
  return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || t('error.failedToLoadContent')}</Text>
      </View>
    );
  }

  const getFlexAlignment = (alignment: string): FlexAlignType => {
    switch (alignment) {
      case 'left': return 'flex-start';
      case 'right': return 'flex-end';
      default: return 'center';
    }
  };

  const renderFeatureBlock = (block: FeaturesBlock, category: string) => (
    <View style={styles.section}>
      <Image
        source={{ uri: block.image }}
        style={styles.sectionImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
        style={styles.overlay}
      >
        <View style={[
          styles.contentContainer,
          { alignItems: block.text_align === 'left' ? 'flex-start' : 'center' }
        ]}>
          <Text style={[
            styles.title,
            { 
              color: '#fff',
              textAlign: block.text_align as any,
              marginBottom: block.subtitle ? 12 : 20
            }
          ]}>
            {block.heading}
          </Text>
          {block.subtitle && (
            <Text style={[
              styles.subtitle,
              { 
                color: '#fff',
                textAlign: block.text_align as any
              }
            ]}>
              {block.subtitle}
            </Text>
          )}
          {block.desc && (
            <Text style={[
              styles.description,
              { 
                color: '#fff',
                textAlign: block.text_align as any
              }
            ]}>
              {block.desc}
            </Text>
          )}
          {category !== 'makeup' && block.btntext && (
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => handleExplorePress(category)}
            >
              <Text style={styles.exploreButtonText}>
                {block.btntext}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setIsDrawerVisible(true)}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.logoText}>A Z U R A</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.fullScreenSection}>
        <Image
          source={{ uri: sliderData.image }}
          style={styles.fullScreenImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
          style={styles.overlay}
        >
          <View style={styles.contentWrapper}>
            <Text style={styles.mainTitle}>
              {sliderData.title}
            </Text>
            <Text style={styles.mainDescription}>
              {sliderData.desc}
            </Text>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => handleExplorePress('nail-care')}
            >
              <Text style={styles.mainButtonText}>
                {sliderData.btntext || t('home.explore')}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Feature Blocks */}
      {Object.entries(featureBlocks).map(([key, block]) => {
        if (!block) return null;
        const category = key === 'block2' ? 'nail-care' : 
                        key === 'block5' ? 'makeup' : 'fragrance';
        
        return (
          <View key={key} style={styles.fullScreenSection}>
            <Image
              source={{ uri: block.image }}
              style={styles.fullScreenImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
              style={styles.overlay}
            >
              <View style={styles.contentWrapper}>
                <Text style={styles.mainTitle}>
                  {block.heading}
                </Text>
                {block.subtitle && (
                  <Text style={styles.mainSubtitle}>
                    {block.subtitle}
                  </Text>
                )}
                <Text style={styles.mainDescription}>
                  {block.desc}
                </Text>
                {category !== 'makeup' && block.btntext && (
                  <TouchableOpacity 
                    style={styles.mainButton}
                    onPress={() => handleExplorePress(category)}
                  >
                    <Text style={styles.mainButtonText}>
                      {block.btntext || t('home.explore')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </View>
        );
      })}

      {/* Services Section */}
      {serviceData && (
        <View style={styles.servicesSection}>
          <Text style={styles.servicesTitle}>
            {serviceData.heading_text}
          </Text>
          <View style={styles.servicesContainer}>
            {serviceData.ishiservices.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Image
                  source={{ uri: service.image }}
                  style={styles.serviceIcon}
                  resizeMode="contain"
                />
                <Text style={styles.serviceTitle}>
                  {service.title}
                </Text>
                <Text style={styles.serviceDescription}>
                  {service.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Drawer Menu */}
      <DrawerMenu 
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
      />
    </ScrollView>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  const Fallback = require('@components/RouteErrorFallback').default;
  return <Fallback error={error} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 16,
    opacity: 0.7,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    position: "relative",
    paddingHorizontal: 20,
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    paddingStart: 10,
    letterSpacing: 4,
  },
  fullScreenSection: {
    width: '100%',
    height: Dimensions.get('window').height,
    position: 'relative',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  contentWrapper: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
    maxWidth: '80%',
  },
  mainButton: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 45,
    minWidth: 200,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    width: width,
    height: height - 120,
    position: "relative",
    backgroundColor: '#000',
  },
  sectionImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    resizeMode: "cover",
  },
  contentContainer: {
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#fff',
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#fff',
    width: '100%',
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.9,
    color: '#fff',
    lineHeight: 24,
    maxWidth: '90%',
    width: '100%',
  },
  exploreButton: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 5,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  servicesSection: {
    backgroundColor: '#000',
    padding: 30,
    width: '100%',
  },
  servicesTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  servicesContainer: {
    flexDirection: getFlexDirection('row'),
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 20,
  },
  serviceItem: {
    alignItems: 'center',
    width: '45%', // Allows 2 items per row with spacing
    marginBottom: 30,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  serviceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceDescription: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
  menuButton: {
    position: 'absolute',
    left: 20,
    top: theme.spacing.xl,
  },
});