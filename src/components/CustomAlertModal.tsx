import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type: 'success' | 'error';
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({ isVisible, title, message, onClose, type }) => {
  const isSuccess = type === 'success';
  const iconName = isSuccess ? 'check-circle' : 'error';
  const iconColor = isSuccess ? '#AEF359' : '#C62828';
  const borderColor = isSuccess ? '#2E7D32' : '#FF6347';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { borderColor: borderColor }]}>
          <MaterialIcons name={iconName} size={48} color={iconColor} style={styles.icon} />
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>
          <TouchableOpacity
            style={styles.buttonClose}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>OK</Text>
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
    backgroundColor: '#1C1C1E',
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
    borderWidth: 2,
  },
  icon: {
    marginBottom: 15,
  },
  titleText: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#E0E0E0',
  },
  buttonClose: {
    backgroundColor: '#AEF359',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: '100%',
  },
  textStyle: {
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CustomAlertModal;