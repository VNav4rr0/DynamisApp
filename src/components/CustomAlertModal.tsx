import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';

// Interface das props (sem alterações)
interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

// CORREÇÃO: Removido o tipo de retorno explícito.
// Deixamos o TypeScript inferir o tipo, o que resolve o conflito.
const CustomAlertModal = ({
  isVisible,
  title,
  message,
  onClose,
  type = 'info',
}: CustomAlertModalProps) => { // O tipo de retorno foi removido daqui
  const { t } = useTranslation();

  const getIconAndColor = (): { iconName: React.ComponentProps<typeof Ionicons>['name'], color: string } => {
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
          <Ionicons name={iconName} size={60} color={color} style={styles.icon} />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: color }]}
            onPress={onClose}
          >
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#1a1a1a',
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
    width: '80%',
  },
  icon: {
    marginBottom: 15,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Fustat-Bold',
    color: '#FFFFFF',
  },
  modalMessage: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Fustat-Regular',
    color: '#ccc',
    lineHeight: 22,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 2,
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Fustat-Bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CustomAlertModal;
