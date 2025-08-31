// src/components/CustomTabBar.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import *as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const { t } = useTranslation();
    
    const totalNavbarContentWidth = width - 40; 
    const navButtonWidth = totalNavbarContentWidth / state.routes.length; 
    const indicatorWidth = navButtonWidth - 10;
    const initialTranslateX = (navButtonWidth / 2) - (indicatorWidth / 2);
    const slideAnim = useRef(new Animated.Value(initialTranslateX)).current;

    const getTabInfo = (routeName: string) => {
        let iconName: keyof typeof MaterialIcons.glyphMap = 'help';
        let textLabel: string = '';

        if (routeName === 'HomeTab') {
        iconName = 'home';
        textLabel = t('navbar.home'); // usar chave i18n
    } else if (routeName === 'ProgressoDetalhadoTab') {
        iconName = 'insights';
        textLabel = t('navbar.progress'); // usar chave i18n
    } else if (routeName === 'PerfilTab') {
        iconName = 'person';
        textLabel = t('navbar.profile'); // usar chave i18n
    }
    return { iconName, textLabel };
    };

    useEffect(() => {
        const targetX = (navButtonWidth * state.index) + (navButtonWidth / 2) - (indicatorWidth / 2);
        
        Animated.spring(slideAnim, {
            toValue: targetX,
            useNativeDriver: true,
            bounciness: 10,
        }).start();
    }, [state.index, navButtonWidth, slideAnim, indicatorWidth]);


    return (
        <View style={styles.bottomNav}>
            <Animated.View
                style={[
                    styles.activeIndicator,
                    {
                        width: indicatorWidth,
                        transform: [{ translateX: slideAnim }]
                    }
                ]}
            />
            <View style={styles.navButtonContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const { iconName, textLabel } = getTabInfo(route.name);

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                            Haptics.selectionAsync();
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.navButton}
                        >
                            <View style={styles.navButtonContent}>
                                <MaterialIcons
                                    name={iconName}
                                    size={26}
                                    color={isFocused ? '#000' : '#FFF'}
                                />
                                {isFocused && <Text style={styles.navText}>{textLabel}</Text>}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        height: 65,
        backgroundColor: '#1C1C1E',
        borderRadius: 32.5,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    activeIndicator: {
        position: 'absolute',
        top: 7.5,
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
    },
    navButtonContainer: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
    },
    navButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    navText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default CustomTabBar;