import React from 'react';
import moment from 'moment';
import filesize from 'filesize';
import LinesEllipsis from 'react-lines-ellipsis';

import {ReactComponent as TrashIcon} from './assets/icons/trash.svg';
import {ReactComponent as UpdateIcon} from './assets/icons/arrow-down-circle-fill.svg';
import {ReactComponent as DownloadIcon} from './assets/icons/file-arrow-down.svg';
import {ReactComponent as FileDownloadIcon} from './assets/icons/file-earmark-arrow-down.svg';
import {ReactComponent as FileIcon} from './assets/icons/paperclip.svg';
import {ReactComponent as MarkAllAsReadIcon} from './assets/icons/check2-circle.svg';
import {ReactComponent as Spinner} from './assets/icons/spinner.svg';
import './assets/theme.scss';

const Email = ({email, deleteOne}) => {
  if (!email) {
    return null;
  }

  return (
    <div className="mb-3">
      <header className="d-flex align-items-end justify-content-end">
        <button type="button"
                className="btn btn-link btn-lg px-2"
                onClick={deleteOne.bind(this, email.messageId)}
                title="E-Mail löschen">
          <TrashIcon/>
        </button>
        <a role="button"
           className="btn btn-link btn-lg pl-2"
           title="E-Mail herunterladen"
           href={baseUrl + '/api/emails/' + email.messageId}>
          <DownloadIcon/>
        </a>
      </header>
      <article className="mail rounded pl-5 p-3">
        <section className="infos">
          <div className="row">
            <div className="col-1">Von:</div>
            <div className="col-8">{email.from.text}</div>
            <div
              className="col-3 text-right timestamp">{getDateString(email.date)}, {moment(email.date).format('HH:mm:ss')} Uhr
            </div>
          </div>
          {!!email.to && (
            <div className="row">
              <div className="col-1">An:</div>
              <div className="col-11">{email.to.text}</div>
            </div>
          )}
          {!!email.cc && (
            <div className="row">
              <div className="col-1">CC:</div>
              <div className="col-11">{email.cc.text}</div>
            </div>
          )}
        </section>
        <hr className="mb-5"/>
        <div className="row">
          <div className="col">
            <h3 className="pb-6">{email.subject}</h3>
          </div>
        </div>
        <div className="row">
          <div className="col" dangerouslySetInnerHTML={{__html: email.html || email.textAsHtml}}/>
        </div>
        {email.attachments.length > 0 &&
        <section className="attachments">
          <hr className="my-5"/>
          <h4>
            {email.attachments.length} {email.attachments.length === 1 ? 'Anhang' : 'Anhänge'}
          </h4>
          <ul>
            {email.attachments.map((file, index) => (
              <li key={index} className="mt-3 mr-2 d-inline-block">
                <a className="btn d-flex flex-column p-3"
                   key={file.filename}
                   href={baseUrl + '/api/attachment/' + email.messageId + '/' + index}>
                  <FileDownloadIcon className="align-self-center mb-2"/>
                  <span className="filename">{file.filename}</span>
                  <span className="filesize">{filesize(file.size)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        }
      </article>
    </div>
  );
};

const Teaser = ({email, isNew, isActive, onClick}) => {
  let from = email.from.value[0];

  return (
    <button type="button"
            className={`teaser w-100 text-left rounded py-3 pr-3 d-flex ${isActive ? 'active' : ''}`}
            onClick={onClick}>
      <div className={`marker mt-1 ${isNew ? 'new' : ''}`} role="presentation">
        <span className="sr-only">Diese E-Mail ist neu</span>
      </div>
      <div className="content w-100">
        <header className="d-flex">
          <div className="from mb-2">{from.address}</div>
          <span className="date ml-auto"
                title={`Datum: ${moment(email.date).format('DD.MM.YYYY HH:mm:ss')} Uhr`}>
            {getDateString(email.date)}
          </span>
        </header>
        <div className="d-flex">
          <span className="subject mr-2">{email.subject}</span>
          <span className="sr-only">Diese E-Mail hat einen oder mehrere Anhänge.</span>
          {email.attachments.length > 0 &&
          <FileIcon className="ml-auto"/>
          }
        </div>
        <div className="excerpt">
          <LinesEllipsis text={email.text} maxLine='2'/>
        </div>
      </div>
    </button>
  )
};

function getDateString(date) {
  let today = moment().startOf('day');
  let dateDiff = today.diff(moment(date).startOf('day'), 'days');

  switch (dateDiff) {
    case 0:
      return 'Heute';
    case 1:
      return 'Gestern';
    default:
      return moment(date).format('DD.MM.YYYY');
  }
}

function removeTrailingSlash(url) {
  return url.replace(/\/$/, "");
}

const baseUrl = process.env.NODE_ENV === 'development'
  ? 'http://localhost:1080'
  : removeTrailingSlash(`${window.location.origin}${window.location.pathname}`);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      emails: [],
      activeEmail: null,
      activeEmailId: null,
      loading: false,
      openedEmails: JSON.parse(localStorage.getItem('openedEmails')) || [],
      newEmails: 0
    };
  }

  componentDidMount() {
    this.setState({loading: true});

    this.loadMails()
  }

  loadMails = () => {
    this.setState({loading: true});

    fetch(`${baseUrl}/api/emails`)
      .then(resp => resp.json())
      .then(emails => {
        let activeEmailStillExists = emails.some(email => email.messageId === this.state.activeEmailId);

        let openedEmails = this.state.openedEmails.filter(openedEmail => emails.some(email => {
          return email.messageId === openedEmail;
        }));

        this.setState({
          emails: emails,
          loading: false,
          activeEmail: (activeEmailStillExists ? this.state.activeEmail : null),
          activeEmailId: (activeEmailStillExists ? this.state.activeEmailId : 0),
          openedEmails: openedEmails,
          newEmails: emails.length - openedEmails.length
        });

        this.updateDocumentTitle(this.state.newEmails);
      });
  };

  newMail(email) {
    this.setState({
      emails: [email, ...this.state.emails],
      newEmails: this.state.newEmails + 1
    });

    this.updateDocumentTitle(this.state.newEmails);
  }

  openMail(email) {
    let openedEmails = this.state.openedEmails;
    let newEmails = this.state.newEmails;
    if (!openedEmails.includes(email.messageId)) {
      newEmails = this.state.newEmails <= 0 ? 0 : this.state.newEmails - 1;
      openedEmails = [...openedEmails, email.messageId];
    }

    this.setState({
      activeEmail: email,
      activeEmailId: email.messageId,
      openedEmails: openedEmails,
      newEmails: newEmails
    });

    this.updateDocumentTitle(newEmails);
    localStorage.setItem('openedEmails', JSON.stringify(openedEmails));
  };

  deleteOne = messageId => {
    // DELETE
  };

  deleteAll = () => {
    /*
    this.socket.emit('deleteAll', res => {
      this.setState({
        emails: res,
        activeEmail: null,
        activeEmailId: null,
        openedEmails: res,
        newEmails: 0
      });

      this.updateDocumentTitle(res);
      localStorage.setItem('openedEmails', JSON.stringify(res));
    })
    */
  };

  markAllAsRead = () => {
    let openedEmails = this.state.emails.map(email => email.messageId);

    this.setState({
      openedEmails: openedEmails,
      newEmails: 0
    });

    this.updateDocumentTitle(0);
    localStorage.setItem('openedEmails', JSON.stringify(openedEmails));
  };

  updateDocumentTitle(count) {
    let suffix = '';

    if (count > 99) {
      suffix = ' (99+)'
    } else if (count > 0) {
      suffix = ` (${count})`;
    }

    document.title = 'Webmail' + suffix;
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <section className="col-md-5 col-lg-4 col-xl-3 sidebar">
            <header className="py-4 pl-5 pr-3 d-flex align-items-start">
              <div className="d-flex flex-column">
                <h1>E-Mails<span className="environment ml-2">{window.location.hostname.split('.')[0]}</span></h1>
                <span>{this.state.newEmails} neu</span>
              </div>
              <button onClick={this.loadMails}
                      disabled={this.state.loading}
                      type="button"
                      className="btn btn-lg btn-link ml-auto p-0"
                      title="E-Mails abrufen">
                <UpdateIcon/>
              </button>
            </header>

            <ul tabIndex="-1">
              <li className={`spinner-wrapper mb-3 ${this.state.loading ? 'loading' : ''}`}>
                <div className="d-flex flex-column align-items-center">
                  <Spinner className="spinner mb-2"/>
                  <span className="spinner-text">Aktualisiere ...</span>
                </div>
              </li>

              {this.state.emails.length > 0 && this.state.emails.map(email => (
                <li key={email.messageId}
                    onClick={this.openMail.bind(this, email)}
                    className="mb-2">
                  <Teaser email={email}
                          isActive={email.messageId === this.state.activeEmailId}
                          isNew={!this.state.openedEmails.includes(email.messageId)}/>
                </li>
              ))}
            </ul>
          </section>

          <section className="col-md-7 col-lg-8 col-xl-9 content">
            <Email email={this.state.activeEmail}
                   deleteOne={this.deleteOne}/>
          </section>
        </div>
        <footer className="row">
          <div className="col-3 d-flex justify-content-between align-items-center">
            <button disabled={this.state.emails.length === 0}
                    onClick={this.markAllAsRead}
                    type="button"
                    className="btn btn-link"
                    title="Alle E-Mails als gelesen markieren">
              <MarkAllAsReadIcon/>
            </button>
            <span>{this.state.emails ? this.state.emails.length : '0'} E-Mails gesamt</span>
            <button disabled={this.state.emails.length === 0}
                    onClick={this.deleteAll}
                    type="button"
                    className="btn btn-link"
                    title="Alle E-Mails löschen">
              <TrashIcon/>
            </button>
          </div>
        </footer>
      </div>
    );
  }
}

export default App;
