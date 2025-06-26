import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');

// Interface para definir os tipos das propriedades que o componente recebe
interface SuccessModalProps {
  isVisible: boolean;
  onClose: () => void;
  userName: string;
}

// O componente é tipado como React.FC (Functional Component)
// e recebe a interface de props
const SuccessModal: React.FC<SuccessModalProps> = ({ isVisible, onClose, userName }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
            <View style={styles.iconBackground}>
                 <Icon name="shield-check" size={48} color="#0D0D0D" />
            </View>

            <Text style={styles.title}>Verificado!</Text>

            <Text style={styles.message}>
                Vamos começar a transformar os resultados de {userName}.
            </Text>

            <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#0D0D0D',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#82CD32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: screenWidth * 0.07,
    fontFamily: 'Fustat-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#EFEFEF',
    fontSize: screenWidth * 0.042,
    fontFamily: 'Fustat-Regular',
    textAlign: 'center',
    lineHeight: screenWidth * 0.065,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#82CD32',
    borderRadius: 30,
    paddingVertical: 16,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 58,
  },
  buttonText: {
    color: '#0D0D0D',
    fontSize: screenWidth * 0.045,
    fontFamily: 'Fustat-Bold',
    fontWeight: '700',
  },
});

export default SuccessModal;