import React from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  PermissionsAndroid,
  TextInput,
  Button,
  Text,
  Alert,
  Platform,
  SafeAreaView,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {
  WebViewMessageEvent,
  WebViewNativeEvent,
} from 'react-native-webview/lib/WebViewTypes';
import {requestMultiple, PERMISSIONS} from 'react-native-permissions';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const stagingBaseURI = 'https://capture.kyc.idfystaging.com';
const prodBaseURI = 'https://capture.kyc.idfy.com';

const requestAllPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      console.log(granted);
    } catch (err) {
      console.warn(err);
    }
  } else if (Platform.OS === 'ios') {
    const result = await requestMultiple([
      PERMISSIONS.IOS.CAMERA,
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      PERMISSIONS.IOS.MICROPHONE,
    ]);
    console.log(result);
  }
};

interface Props {}

interface State {
  url: string;
  launchWebview: boolean;
  isLoading: boolean;
  modalVisible: boolean;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      url: '',
      launchWebview: false,
      isLoading: false,
      modalVisible: false,
    };
    this.onChangeText = this.onChangeText.bind(this);
    this.launch = this.launch.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
    this.openLink = this.openLink.bind(this);
    this.closeLink = this.closeLink.bind(this);
  }
  webviewRef = React.createRef();

  componentDidMount() {
    requestAllPermissions();
  }

  onChangeText(value: string) {
    this.setState({url: value});
  }

  validURL(str: string): boolean {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      str,
    );
  }

  launch() {
    if (
      this.state.url &&
      this.validURL(this.state.url) &&
      (this.state.url.includes(stagingBaseURI) ||
        this.state.url.includes(prodBaseURI))
    ) {
      this.setState({modalVisible: true});
    } else {
      Alert.alert('Please enter valid url');
    }
  }

  onStateChange(state: WebViewNativeEvent) {
    if (
      !state.url.includes(stagingBaseURI) &&
      !state.url.includes(prodBaseURI)
    ) {
      this.setState({launchWebview: false});
    }
  }

  async onWebviewMessage(event: WebViewMessageEvent) {
    console.log('EVENT RECIEVED:', JSON.parse(event.nativeEvent.data));
    const message = JSON.parse(event.nativeEvent.data);
    if (message.status === 'DIGILOCKER_OPEN') {
      this.openLink(message.uri);
    } else if (message.status === 'DIGILOCKER_CLOSE') {
      this.closeLink();
    }
  }

  closeLink() {
    InAppBrowser.close();
  }

  async openLink(url: string) {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#453AA4',
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: true,
          toolbarColor: '#6200EE',
          secondaryToolbarColor: 'black',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          // Specify full animation resource identifier(package:anim/name)
          // or only resource name(in case of animation bundled with app).
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right',
          },
          headers: {
            'my-custom-header': 'my custom header value',
          },
        });
      } else {
        Linking.openURL(url);
      }
    } catch (error) {
      this.openLink(url);
    }
  }

  render() {
    return (
      <SafeAreaView style={[styles.container, styles.horizontal]}>
        <StatusBar
          backgroundColor="#000000"
          barStyle="light-content"
          hidden={true}
        />
        {!this.state.launchWebview && (
          <View style={[styles.inputHolder]}>
            <View style={styles.flex}>
              <Text>Please Enter the Capture Link to open in webview</Text>
            </View>
            <View style={[styles.input, styles.flex]}>
              <TextInput
                style={styles.inputField}
                placeholder="Enter Url"
                onChangeText={this.onChangeText}
                value={this.state.url}
              />
            </View>
            <View style={styles.flex}>
              <Button onPress={this.launch} title="Launch" />
            </View>
          </View>
        )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.setState({modalVisible: false});
          }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Pressable
                style={[styles.button, styles.buttonOpen]}
                onPress={() =>
                  this.setState({modalVisible: false}, () => {
                    this.openLink(this.state.url);
                  })
                }>
                <Text style={styles.textStyle}>Open with In-app browser</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonOpen]}
                onPress={() =>
                  this.setState({modalVisible: false, launchWebview: true})
                }>
                <Text style={styles.textStyle}>Open with Webview</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        {this.state.launchWebview && (
          <>
            <WebView
              source={{
                uri: this.state.url,
              }}
              onNavigationStateChange={this.onStateChange}
              autoManageStatusBarEnabled={false}
              geolocationEnabled={true}
              javaScriptEnabled={true}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onMessage={e => this.onWebviewMessage(e)}
            />
          </>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    display: 'flex',
    marginBottom: '10%',
  },
  inputHolder: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    maxWidth: 300,
    borderWidth: 1,
    display: 'flex',
  },
  spinnerTextStyle: {
    color: '#e60e3b',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
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
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: '80%',
    marginBottom: '2%',
  },
  buttonOpen: {
    backgroundColor: '#2196F3',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  inputField: {
    color: '#000',
  },
});

export default App;
