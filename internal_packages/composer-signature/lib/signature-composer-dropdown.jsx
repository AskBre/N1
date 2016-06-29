import {
  React,
  Actions,
  SignatureStore,
} from 'nylas-exports'

import {
  Menu,
  RetinaImg,
  ButtonDropdown,
} from 'nylas-component-kit'
import SignatureUtils from './signature-utils'


export default class SignatureComposerDropdown extends React.Component {
  static displayName = 'SignatureComposerDropdown'

  static containerRequired = false

  static propTypes = {
    draft: React.PropTypes.object.isRequired,
    session: React.PropTypes.object.isRequired,
    value: React.PropTypes.object,
    accounts: React.PropTypes.array,
  }

  constructor() {
    super()
    this.state = this._getStateFromStores()
  }

  componentDidMount() {
    this.unsubscribers = [
      SignatureStore.listen(this._onChange),
    ]
  }

  componentDidUpdate(previousProps) {
    // if checks that the from account differs -- executed when the from email is changed
    if (previousProps.value.accountId !== this.props.value.accountId) {
      const newAccountDefaultSignature = this.state.signatureForAccountId(this.props.value.accountId)
      this._changeSignature(newAccountDefaultSignature)
    }
  }

  componentWillUnmount() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
  }

  _onChange = () => {
    this.setState(this._getStateFromStores())
  }


  _getStateFromStores() {
    const signatures = SignatureStore.getSignatures()
    const signatureForAccountId = SignatureStore.signatureForAccountId
    const objectToArray = SignatureStore.objectToArray
    return {
      signatures: signatures,
      signatureForAccountId: signatureForAccountId,
      objectToArray: objectToArray,
    }
  }

  _renderSigItem = (sigItem) => {
    return (
      <span>{sigItem.title}</span>
    )
  }
  _changeSignature = (sig) => {
    if (sig) {
      const body = SignatureUtils.applySignature(this.props.draft.body, sig.body)
      this.props.session.changes.add({body})
    }
  }

  _isSelected = (sigObj) => {
    // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    const escapeRegExp = (str) => {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    const signatureRegex = new RegExp(escapeRegExp(`<signature>${sigObj.body}</signature>`))
    const signatureLocation = signatureRegex.exec(this.props.draft.body)
    if (signatureLocation) return true
    return false
  }

  _onClickNoSignature = () => {
    this._changeSignature({body: ''})
  }

  _onClickEditSignatures() {
    Actions.switchPreferencesTab('Signatures')
    Actions.openPreferences()
  }

  _renderSignatures() {
    const header = [<div className="item" onMouseDown={this._onClickNoSignature}><span>No signature</span></div>]
    const footer = [<div className="item" onMouseDown={this._onClickEditSignatures}><span>Edit Signatures...</span></div>]

    const sigItems = this.state.objectToArray(this.state.signatures)
    return (
      <Menu
        headerComponents={header}
        footerComponents={footer}
        items={sigItems}
        itemKey={sigItem => sigItem.id}
        itemContent={this._renderSigItem}
        onSelect={this._changeSignature}
        itemChecked={this._isSelected}
      />
    )
  }

  _renderSignatureIcon() {
    return (
      <RetinaImg
        className="signature-button"
        name="top-signature-dropdown.png"
        mode={RetinaImg.Mode.ContentIsMask}
      />
    )
  }

  render() {
    const sigs = this.state.signatures;
    const icon = this._renderSignatureIcon()

    // ** what to of if there are no signatures?
    if (sigs !== {}) {
      return (
        <div className="signature-button-dropdown">
          <ButtonDropdown
            primaryItem={icon}
            menu={this._renderSignatures()}
            bordered={false}
          />
        </div>
      )
    }
    return null
  }


}