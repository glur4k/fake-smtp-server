import React from 'react';
import moment from 'moment';
import filesize from 'filesize';
import Truncate from 'react-truncate';

import {ReactComponent as TrashIcon} from './assets/icons/trash.svg';
import {ReactComponent as UpdateIcon} from './assets/icons/arrow-down-circle-fill.svg';
import {ReactComponent as DownloadIcon} from './assets/icons/cloud-download.svg';
import {ReactComponent as FileDownloadIcon} from './assets/icons/file-earmark-richtext.svg';
import {ReactComponent as FileIcon} from './assets/icons/paperclip.svg';
import {ReactComponent as MarkAllAsReadIcon} from './assets/icons/check2-circle.svg';
import {ReactComponent as MailIcon} from './assets/icons/envelope-fill.svg';
import {ReactComponent as Spinner} from './assets/icons/spinner.svg';
import './assets/theme.scss';

const Email = ({email}) => {
  if (!email) {
    return null;
  }

  return (
    <article className="mail rounded-lg shadow px-5 pb-5 pt-3 mb-5">
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
        <h4>{email.attachments.length} {email.attachments.length === 1 ? 'Anhang' : 'Anhänge'}</h4>

        <ul>
          {email.attachments.map((file, index) => (
            <li key={index} className="mt-3 mr-2 d-inline-block">
              <a className="btn btn-outline-primary d-flex p-2 pr-3 align-items-center"
                 key={file.filename}
                 title="Datei herunterladen"
                 href={baseUrl + '/api/attachment/' + email.messageId + '/' + index}>
                <FileDownloadIcon className="mr-3"/>
                <div className="d-flex flex-column">
                  <span className="filename">{file.filename}</span>
                  <span className="filesize text-left">{filesize(file.size)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
      }
    </article>
  );
};

const Teaser = ({email, isNew, isActive, onClick}) => {
  let from = email.from.value[0];

  return (
    <button type="button"
            className={`teaser text-left w-100 rounded p-3 d-flex ${isActive ? 'active' : ''}`}
            onClick={onClick}>
      <div className={`marker mt-1 mr-2 ${isNew ? 'new' : ''}`} role="presentation" title="Diese E-Mail ist neu">
        <span className="sr-only">Diese E-Mail ist neu</span>
      </div>
      <div className="content w-100">
        <div className="header d-flex">
          <div className="from mb-2">{from.address}</div>
          <span className="date ml-auto"
                title={`Datum: ${moment(email.date).format('DD.MM.YYYY HH:mm:ss')} Uhr`}>
            {getDateString(email.date)}
          </span>
        </div>
        <div className="d-flex">
          <span className="subject mr-2">{email.subject}</span>
          {email.attachments.length > 0 &&
          <FileIcon className="ml-auto" title="Diese E-Mail hat einen oder mehrere Anhänge."/>
          }
        </div>
        <div className="excerpt">
          <Truncate lines={2} width={336}>
            {email.text}
          </Truncate>
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
      readEmails: JSON.parse(localStorage.getItem('readEmails')) || [],
      updatedAt: null,
      newEmails: 0
    };
  }

  componentDidMount() {
    this.setState({loading: true});
    this.loadAllMails();
  }

  loadNewMails = () => {
    this.setState({loading: true});

    let param = "?since=" + this.state.updatedAt;
    let updatedAt = Date.now();

    fetch(`${baseUrl}/api/emails` + param)
      .then(resp => resp.json())
      .then(newEmails => {
        let emails = [...newEmails, ...this.state.emails]

        this.setState({
          emails: emails,
          loading: false,
          updatedAt: updatedAt,
          newEmails: emails.length - this.state.readEmails.length
        });

        this.updateDocumentTitle(this.state.newEmails);
      });
  }

  loadAllMails = () => {
    let updatedAt = Date.now();

    fetch(`${baseUrl}/api/emails`)
      .then(resp => resp.json())
      .then(emails => {
        let readEmails = this.state.readEmails.filter(readEmail => emails.some(email => {
          return email.messageId === readEmail;
        }));

        this.setState({
          emails: emails,
          loading: false,
          readEmails: readEmails,
          updatedAt: updatedAt,
          newEmails: emails.length - readEmails.length
        });

        this.updateDocumentTitle(this.state.newEmails);
      });
  };

  openMail(email) {
    let readEmails = this.state.readEmails;
    let newEmails = this.state.newEmails;

    if (!readEmails.includes(email.messageId)) {
      newEmails = this.state.newEmails <= 0 ? 0 : this.state.newEmails - 1;
      readEmails = [...readEmails, email.messageId];
    }

    this.setState({
      activeEmail: email,
      activeEmailId: email.messageId,
      readEmails: readEmails,
      newEmails: newEmails
    });

    this.updateDocumentTitle(newEmails);
    localStorage.setItem('readEmails', JSON.stringify(readEmails));
  };

  deleteOne = messageId => {
    fetch(`${baseUrl}/api/emails/${messageId}`, {
      method: 'DELETE'
    })
      .then(() => {
        let readEmails = this.state.readEmails.filter(id => id !== messageId);

        this.setState({
          emails: this.state.emails.filter(mail => mail.messageId !== messageId),
          activeEmail: null,
          activeEmailId: null,
          readEmails: readEmails
        });

        localStorage.setItem('readEmails', JSON.stringify(this.state.readEmails));
      });
  };

  deleteAll = () => {
    fetch(`${baseUrl}/api/emails`, {
      method: 'DELETE'
    })
      .then(() => {
        this.setState({
          emails: [],
          activeEmail: null,
          activeEmailId: null,
          readEmails: [],
          newEmails: 0
        });

        this.updateDocumentTitle(null);
        localStorage.setItem('readEmails', JSON.stringify(this.state.readEmails));
      });
  };

  markAllAsRead = () => {
    let readEmails = this.state.emails.map(email => email.messageId);

    this.setState({
      readEmails: readEmails,
      newEmails: 0
    });

    this.updateDocumentTitle(0);
    localStorage.setItem('readEmails', JSON.stringify(readEmails));
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

  getEnvironmentString = () => {
    if (window.location.hostname.includes('fa.etu')) {
      return 'ETU';
    }

    return window.location.hostname.split('.')[0];
  }

  render() {
    return (
      <div className="main-wrapper w-100">
        <header className="d-flex align-items-center">
          <div className="d-flex py-4 pl-5 pr-2 head">
            <div className="d-flex flex-column">
              <h1>E-Mails<span className="environment ml-2">{this.getEnvironmentString()}</span></h1>
              <span>{this.state.newEmails} ungelesen</span>
            </div>
            <button onClick={this.loadNewMails}
                    disabled={this.state.loading}
                    type="button"
                    className="btn btn-lg btn-link ml-auto p-0"
                    title="E-Mails abrufen">
              <UpdateIcon/>
            </button>
          </div>

          {this.state.activeEmail &&
            <div className="mail-header d-flex  w-100 pb-2 pr-2 mx-3 align-items-end justify-content-end border-secondary">
              <button type="button"
                      className="btn btn-link"
                      onClick={this.deleteOne.bind(this, this.state.activeEmailId)}
                      title="E-Mail löschen">
                <TrashIcon/>
              </button>
              <a role="button"
                 className="btn btn-link"
                 title="E-Mail herunterladen"
                 href={baseUrl + '/api/emails/' + this.state.activeEmailId}>
                <DownloadIcon/>
              </a>
            </div>
          }
        </header>

        <aside className="pl-3">
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
                        isNew={!this.state.readEmails.includes(email.messageId)}/>
              </li>
            ))}
          </ul>

          <footer className="d-flex justify-content-between align-items-center">
            <button disabled={this.state.emails.length === 0}
                    onClick={this.markAllAsRead}
                    type="button"
                    className="btn btn-link"
                    title="Alle E-Mails als gelesen markieren">
              <MarkAllAsReadIcon/>
            </button>
            <span className="pt-1">{this.state.emails ? this.state.emails.length : '0'} E-Mails gesamt</span>
            <button disabled={this.state.emails.length === 0}
                    onClick={this.deleteAll}
                    type="button"
                    className="btn btn-link"
                    title="Alle E-Mails löschen">
              <TrashIcon/>
            </button>
          </footer>
        </aside>

        <main className="px-4">
          {!this.state.activeEmail &&
            <div className="empty-wrapper d-flex flex-column align-items-center justify-content-center">
              <MailIcon className="d-block mb-3"/>
              <span>Keine E-Mail ausgewählt</span>
            </div>
          }

          <Email email={this.state.activeEmail}
                 deleteOne={this.deleteOne}/>
        </main>
      </div>
    );
  }
}

export default App;
