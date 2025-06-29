// src/components/CustomTabBar.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import *as Haptics from 'expo-haptics'; // Para o feedback tátil

const { width } = Dimensions.get('window');

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    // Largura total da navbar visível (descontando left/right 20px do bottomNav no App.tsx)
    const totalNavbarVisibleWidth = width - 40; // 20 de left + 20 de right do contêiner da navbar no App.tsx
    const navButtonWidth = totalNavbarVisibleWidth / state.routes.length; // Largura igual para cada botão

    // A posição inicial do Animated.Value (translateX)
    // Queremos que o centro do indicador esteja no centro do primeiro botão (index 0).
    // Posiciona no início do primeiro botão e então ajusta para centralizar o indicador.
    const indicatorWidth = navButtonWidth - 10; // Largura do indicador branco
    const initialTranslateX = (navButtonWidth * 0) + (navButtonWidth / 2) - (indicatorWidth / 2);
    const slideAnim = useRef(new Animated.Value(initialTranslateX)).current;


    // Mapeamento de nome de rota para o texto e ícone da aba
    const getTabInfo = (routeName: string) => {
        let iconName: keyof typeof MaterialIcons.glyphMap = 'help';
        let textLabel: string = '';

        if (routeName === 'HomeTab') {
            iconName = 'home';
            textLabel = 'Home';
        } else if (routeName === 'ProgressoDetalhadoTab') {
            iconName = 'insights';
            textLabel = 'Metas';
        } else if (routeName === 'PerfilTab') {
            iconName = 'person';
            textLabel = 'Perfil';
        }
        return { iconName, textLabel };
    };

    // Efeito para a animação do indicador branco
    useEffect(() => {
        // Calcula a posição alvo para o indicador:
        // (índice da aba * largura do botão) + (metade da largura do botão) - (metade da largura do indicador)
        const targetX = (navButtonWidth * state.index) + (navButtonWidth / 2) - (indicatorWidth / 2);
        
        Animated.spring(slideAnim, {
            toValue: targetX,
            useNativeDriver: true, // Continua usando nativeDriver para translateX
            bounciness: 10,
        }).start();
    }, [state.index, navButtonWidth, slideAnim, indicatorWidth]); // Adicionado indicatorWidth como dependência


    return (
        <View style={styles.bottomNav}>
            {/* O indicador branco animado */}
            <Animated.View
                style={[
                    styles.activeIndicator,
                    {
                        width: indicatorWidth, // Largura do indicador calculada
                        // Removido 'left' do estilo, pois o translateX vai controlar a posição horizontal
                        transform: [{ translateX: slideAnim }] // Aplica a animação aqui
                    }
                ]}
            />

            {/* Container dos botões da navbar */}
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
                            Haptics.selectionAsync(); // Feedback tátil ao selecionar aba
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
                                    color={isFocused ? '#111111' : '#FFF'} // Cor do ícone
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
        backgroundColor: '#111111',
        borderRadius: 32.5,
        flexDirection: 'row', // Para os botões ficarem lado a lado
        alignItems: 'center', // Centraliza itens verticalmente
        // Removido justify-content: 'space-around' daqui para usar o flex: 1 nos botões
        overflow: 'hidden', // Importante para o indicador não sair dos limites da barra
        paddingHorizontal: 0, // Remover paddingHorizontal aqui, o padding será tratado pelo `left` e `right` do App.tsx e pelos cálculos
        // IMPORTANTE: O App.tsx define left: 20, right: 20 para bottomNav.
        // O width total é Dimensions.get('window').width - 40.
        // O navButtonWidth (e a animação) devem trabalhar dentro dessa largura.
    },
    activeIndicator: {
        position: 'absolute',
        top: 7.5, // Posição vertical dentro da barra
        height: 50, // Altura do indicador
        backgroundColor: '#FFFFFF', // Cor branca
        borderRadius: 25, // Metade da altura para ser oval
        // Removido 'left' fixo, e 'width' é definido dinamicamente no JSX
        // A posição horizontal é controlada por transform: translateX
    },
    navButtonContainer: {
        flex: 1, // Ocupa todo o espaço restante
        flexDirection: 'row',
        height: '100%',
        // Importante: Este container está dentro do bottomNav (que tem left:20, right:20 do App.tsx).
        // Então, sua largura já é (width - 40). Os botões se distribuem aqui.
    },
    navButton: {
        flex: 1, // Cada botão ocupa uma parte igual do navButtonContainer
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    navText: {
        color: '#000', // Texto preto para a aba ativa
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default CustomTabBar;