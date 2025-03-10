import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Dialog, Grid, Checkbox, Dropdown, Icon, Menu } from '@b-design/ui';
import locale from '../../../../utils/locale';
import type { ContainerLogResponse, PodBase } from '../../../../interface/observation';
import Translation from '../../../../components/Translation';
import './index.less';
import { listContainerLog } from '../../../../api/observation';
import Ansi from 'ansi-to-react';
import { momentDate, momentShortDate } from '../../../../utils/common';
import { If } from 'tsx-control-statements/components';

const { Row, Col } = Grid;

type Props = {
  pod: PodBase;
  containerName: string;
  clusterName: string;
  onClose: () => void;
};

type State = {
  autoRefresh: boolean;
  refreshInterval: number;
  logs: LogLine[];
  info?: { fromDate: string; toDate: string };
  showTimestamps: boolean;
  previous: boolean;
};

interface LogLine {
  content: string;
  timestamp: string;
}

class ContainerLog extends Component<Props, State> {
  private readonly maxLogSize = 2e9;
  private readonly maxTailLine = 3000;
  timeoutID?: NodeJS.Timeout;
  constructor(props: Props) {
    super(props);
    this.state = {
      autoRefresh: true,
      refreshInterval: 5000,
      logs: [],
      showTimestamps: false,
      previous: false,
    };
  }
  componentDidMount() {
    this.loadContainerLog();
  }

  componentWillUnmount() {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
    }
  }

  toLogLines = (logs: string) => {
    const logLines = logs.split('\n');
    const lines: LogLine[] = [];
    logLines.map((line) => {
      if (line) {
        const startsWithDate = 0 <= Number(line[0]) && Number(line[0]) <= 9; //2017-...
        const idx = line.indexOf(' ');
        if (idx > 0 && startsWithDate) {
          const timestamp = line.substring(0, idx);
          const content = line.substring(idx + 1);
          lines.push({ content: content, timestamp: timestamp });
        } else {
          lines.push({ content: line, timestamp: '' });
        }
      }
    });
    return lines;
  };

  loadContainerLog = () => {
    const { pod, containerName, clusterName } = this.props;
    const { previous } = this.state;
    listContainerLog({
      cluster: clusterName,
      namespace: pod.metadata.namespace,
      pod: pod.metadata.name,
      container: containerName,
      previous: previous,
      timestamps: true,
      tailLines: this.maxTailLine,
    })
      .then((res: ContainerLogResponse) => {
        if (res && res.logs) {
          this.setState({ logs: this.toLogLines(res.logs), info: res.info });
        }
        const { autoRefresh, refreshInterval } = this.state;
        if (autoRefresh) {
          this.timeoutID = setTimeout(() => this.loadContainerLog(), refreshInterval);
        }
      })
      .catch(() => {});
  };

  setAutoRefresh = (v: boolean) => {
    this.setState({ autoRefresh: v });
    if (!v && this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = undefined;
    }
    if (v && !this.timeoutID) {
      this.loadContainerLog();
    }
  };

  render() {
    const { logs, info, showTimestamps, autoRefresh, refreshInterval, previous } = this.state;
    return (
      <Dialog
        className="commonDialog logDialog"
        locale={locale().Dialog}
        visible={true}
        footerActions={[]}
        onClose={this.props.onClose}
        isFullScreen
        title={<Translation>Container Log</Translation>}
        footer={
          <Row style={{ width: '100%' }}>
            <Col span={12}>
              <span style={{ float: 'left' }}>
                <Translation>Logs Date</Translation>:
                <span
                  style={{ marginLeft: '8px' }}
                  className="logDate"
                  title={momentDate(info?.fromDate)}
                >
                  {momentShortDate(info?.fromDate)}
                </span>
                ~
                <span className="logDate" title={momentDate(info?.toDate)}>
                  {momentShortDate(info?.toDate)}
                </span>
              </span>
            </Col>
            <Col span={12}>
              <div className="logAction">
                <Checkbox
                  checked={showTimestamps}
                  onChange={(v) => this.setState({ showTimestamps: v })}
                >
                  <Translation>Show timestamps</Translation>
                </Checkbox>
                <Checkbox checked={autoRefresh} onChange={this.setAutoRefresh}>
                  <Translation>Auto-refresh</Translation>(every {refreshInterval / 1000} s.)
                </Checkbox>
                <Dropdown trigger={<Icon type="ellipsis-vertical" />}>
                  <Menu>
                    <Menu.Item>
                      <Checkbox checked={previous} onChange={(v) => this.setState({ previous: v })}>
                        <Translation>Show previous logs</Translation>
                      </Checkbox>
                    </Menu.Item>
                  </Menu>
                </Dropdown>
              </div>
            </Col>
          </Row>
        }
      >
        <div className="logBox">
          {logs.map((line) => {
            return (
              <div className="logLine">
                <span className="content">
                  <If condition={showTimestamps}>
                    {momentDate(line.timestamp)} | <Ansi>{line.content}</Ansi>
                  </If>
                  <If condition={!showTimestamps}>
                    <Ansi>{line.content}</Ansi>
                  </If>
                </span>
              </div>
            );
          })}
        </div>
      </Dialog>
    );
  }
}

export default withTranslation()(ContainerLog);
