import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const GerenciarInformacoesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [genero, setGenero] = useState<'homem' | 'mulher'>('homem');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" style={{ marginBottom: -4 }} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerText}>Gerenciar Informações</Text>
          <View style={styles.headerLine} />
        </View>
      </View>

      {/* Dados Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        <TextInput placeholder="Nome completo" placeholderTextColor="#888" style={styles.input} />
        <View style={styles.row}>
          <TextInput placeholder="Sua Idade" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
          <TextInput placeholder="Sua Altura" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
        </View>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, genero === 'homem' && styles.genderButtonActive]}
            onPress={() => setGenero('homem')}
          >
            {genero === 'homem' && <MaterialIcons name="check" size={18} color="#FFF" />}
            <Text style={styles.genderText}>Homem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, genero === 'mulher' && styles.genderButtonActive]}
            onPress={() => setGenero('mulher')}
          >
            {genero === 'mulher' && <MaterialIcons name="check" size={18} color="#FFF" />}
            <Text style={styles.genderText}>Mulher</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta Pessoais */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Meta Pessoais</Text>
        <View style={styles.row}>
          <TextInput placeholder="Peso Atual" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={36} color="#C2185B" style={{ marginBottom: 8 }} />
          </View>
          <TextInput placeholder="Peso Meta" placeholderTextColor="#888" style={[styles.input, styles.halfInput]} />
        </View>
        <TextInput placeholder="Objetivo" placeholderTextColor="#888" style={styles.input} />
        <TextInput placeholder="Nível de Atividades" placeholderTextColor="#888" style={styles.input} />
      </View>

      {/* Conta */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <TextInput placeholder="E-mail" placeholderTextColor="#888" style={styles.input} />
        <TextInput placeholder="Senha" placeholderTextColor="#888" style={styles.input} secureTextEntry />
      </View>

      {/* Botões */}
      <TouchableOpacity style={styles.saveButton}>
        <MaterialIcons name="edit" size={20} color="#000" />
        <Text style={styles.saveButtonText}>Salvar Alterações</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton}>
        <MaterialIcons name="delete" size={20} color="red" />
        <Text style={styles.deleteButtonText}>Excluir Conta</Text>
      </TouchableOpacity>

      <Text style={styles.warningText}>Esta ação é permanente e não pode ser desfeita.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 100,
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 10,
  },
  backButton: {
    marginTop: -4,
  },
  headerText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerLine: {
    marginTop: 6,
    height: 2,
    backgroundColor: '#82CD32',
    borderRadius: 2,
    width: 180,
  },
  card: {
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 50,
    overflow: 'hidden',
    marginTop: 10,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  genderButtonActive: {
    backgroundColor: '#2E2E2E',
  },
  genderText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#AEF359',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 30, // desce o botão "Sair da conta"
  },
  deleteButtonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 15,
  },
  warningText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 20,
  },
});

export default GerenciarInformacoesScreen;
