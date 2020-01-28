import React, {Component} from 'react';
import {Card, CardHeader, Col, Collapse, Container, ListGroup, ListGroupItem, Row} from 'reactstrap';
import moment from 'moment';

const Email = ({email, isOpen, onToggle}) =>
{
  let from = email.from.value[0];
  return (
      <Card>
        <CardHeader onClick={onToggle}>
          <Row>
            <Col className="px-2" md={2}>
              {moment(email.date).format('DD.MM.YYYY HH:mm:ss')}
            </Col>
            <Col className="px-2" md={4}>
              <div className="text-truncate" title={from.name}>
                {from.address}
              </div>

            </Col>
            <Col className="px-2" md={5}>
              <div className="text-truncate">
                {email.subject}
              </div>
            </Col>
            <Col className="px-2" md={1}>
              <div className="text-truncate">
                <a href={baseUrl + '/api/emails/' + email.messageId}>.eml</a>
              </div>
            </Col>
          </Row>
        </CardHeader>
        <Collapse isOpen={isOpen}>
          <ListGroup className="list-group-flush">
            <ListGroupItem>
              <strong>Von:&nbsp;</strong>
              <span dangerouslySetInnerHTML={{__html: email.from.html}}/>
            </ListGroupItem>
            <ListGroupItem>
              <strong>An:&nbsp;</strong>
              <span dangerouslySetInnerHTML={{__html: email.to.html}}/>
            </ListGroupItem>
            {
              email.cc !== undefined &&
              (
                  <ListGroupItem>
                    <strong>CC:&nbsp;</strong>
                    <span dangerouslySetInnerHTML={{__html: email.cc.html}}/>
                  </ListGroupItem>
              )
            }
            <ListGroupItem>
              <strong>Betreff:&nbsp;</strong>
              {email.subject}
            </ListGroupItem>
          </ListGroup>
          <div className="card-body">
            <div dangerouslySetInnerHTML={{__html: email.html || email.textAsHtml}}/>
          </div>
          <ListGroup className="list-group-flush" hidden={email.attachments.length === 0}>
            <ListGroupItem>
              <b>Attachments: </b>
              {
                email.attachments.map((attachment, index) => (
                  <a key={attachment.filename} href={baseUrl + '/api/attachment/' + email.messageId + '/' + index}>{attachment.filename}</a>
              ))
              }

            </ListGroupItem>
          </ListGroup>
        </Collapse>
      </Card>
  )
};

function removeTrailingSlash(url)
{
  return url.replace(/\/$/, "");
}

const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:1080'
    : removeTrailingSlash(`${window.location.origin}${window.location.pathname}`);

class App extends Component
{

  state = {
    emails: null,
    activeEmail: null
  };

  componentDidMount()
  {
    fetch(`${baseUrl}/api/emails`)
    .then(resp => resp.json())
    .then(emails =>
    {
      this.setState({emails: emails});
    });
  }

  handleToggle = email => () =>
  {
    if (this.state.activeEmail === email.messageId)
    {
      this.setState({activeEmail: null});
    } else
    {
      this.setState({activeEmail: email.messageId});
    }
  };

  deleteAll = () =>
  {
    fetch(`${baseUrl}/api/emails`, {
      method: 'DELETE'
    })
    .then(() =>
    {
      this.setState({emails: []});
    });
  }

  render()
  {
    const isLoading = !this.state.emails;
    const isEmpty = !isLoading && this.state.emails.length === 0;
    const hasEmails = !isLoading && !isEmpty;

    return (
        <Container>
          <header>
            <Row>
              <Col className="d-flex flex-row py-4 justify-content-between">
                <h1>E-Mails ({isLoading ? 'Lade...' : this.state.emails.length})</h1>

                <button type="button"
                        className="btn btn-light"
                        disabled={!hasEmails}
                        onClick={this.deleteAll}>Alle Löschen
                </button>
              </Col>
            </Row>
          </header>
          {hasEmails && this.state.emails.map(email => (
              <Email email={email}
                     isOpen={this.state.activeEmail === email.messageId}
                     onToggle={this.handleToggle(email)}
                     key={email.messageId}/>
          ))
          }
          {isEmpty && (
              <div className="alert alert-info">
                Keine E-Mails vorhanden
              </div>
          )}
        </Container>
    );
  }
}

export default App;
