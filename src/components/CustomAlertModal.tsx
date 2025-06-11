import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  isVisible,
  title,
  message,
  onClose,
  type = 'info',
}) => {
  const { t } = useTranslation();

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { iconName: 'checkmark-circle-outline', color: '#82CD32' };
      case 'error':
        return { iconName: 'close-circle-outline', color: '#FF6347' };
      case 'info':
      default:
        return { iconName: 'information-circle-outline', color: '#E80095' };
    }
  };

  const { iconName, color } = getIconAndColor();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Icon name={iconName} size={60} color={color} style={styles.icon} />
          {/* TÍTULO E MENSAGEM JÁ ESTÃO EM TEXT */}
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: color }]}
            onPress={onClose}
          >
            {/* BOTÃO JÁ ESTÁ EM TEXT E USANDO T() */}
            <Text style={styles.buttonText}>{t('cadastro.alertButtonUnderstand')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fundo escuro semitransparente
  },
  modalView: {
    margin: 20,
    backgroundColor: '#1a1a1a', // Fundo escuro do modal
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%', // Largura do modal
  },
  icon: {
    marginBottom: 15,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Fustat-Bold', // Use sua fonte
    color: '#FFFFFF',
  },
  modalMessage: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Fustat-Regular', // Use sua fonte
    color: '#ccc',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF', // Cor do texto do botão
    fontFamily: 'Fustat-Bold', // Use sua fonte
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CustomAlertModal;