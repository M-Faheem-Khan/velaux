import React, { Component } from 'react';
import { Table, Message, Dialog, Tag } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import './index.less';
import locale from '../../../../utils/locale';
import type { Env, NameAlias } from '../../../../interface/env';
import { deleteEnv } from '../../../../api/env';
import { Link } from 'dva/router';
import { If } from 'tsx-control-statements/components';
import type { Project } from '../../../../interface/project';
import Permission from '../../../../components/Permission';
const { Group: TagGroup } = Tag;

type Props = {
  list?: Env[];
  updateEnvList: () => void;
  changeISEdit: (param: boolean, record: Env) => void;
};

class TableList extends Component<Props> {
  onDelete = (record: Env) => {
    deleteEnv({ name: record.name || '' }).then((re) => {
      if (re) {
        Message.success('Environment deleted successfully');
        this.props.updateEnvList();
      }
    });
  };
  onEdit = (record: Env) => {
    this.props.changeISEdit(true, record);
  };

  showEnvAppList = (envName: string) => {
    this.setState({ showEnvAppList: true, envName: envName });
  };

  getColumns = () => {
    return [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return (
            <a
              onClick={() => {
                this.showEnvAppList(v);
              }}
            >
              {v}
            </a>
          );
        },
      },
      {
        key: 'alias',
        title: <Translation>Alias</Translation>,
        dataIndex: 'alias',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'project',
        title: <Translation>Project</Translation>,
        dataIndex: 'project',
        cell: (v: Project) => {
          if (v && v.name) {
            return <Link to={`/projects/${v.name}/summary`}>{v && v.name}</Link>;
          } else {
            return null;
          }
        },
      },
      {
        key: 'namespace',
        title: <Translation>Namespace</Translation>,
        dataIndex: 'namespace',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      // {
      //   key: 'project',
      //   title: <Translation>Project</Translation>,
      //   dataIndex: 'project',
      //   cell: (v: NameAlias) => {
      //     return <span>{v.alias || v.name}</span>;
      //   },
      // },
      {
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'targets',
        title: <Translation>Targets</Translation>,
        dataIndex: 'targets',
        cell: (v?: NameAlias[]) => {
          return (
            <TagGroup>
              {v?.map((target: NameAlias) => {
                return (
                  <Tag color="green" key={target.name}>
                    <Link to="/targets"> {target.alias ? target.alias : target.name}</Link>
                  </Tag>
                );
              })}
            </TagGroup>
          );
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Env) => {
          return (
            <div>
              <If condition={record.targets?.length}>
                <Permission
                  request={{ resource: `environment:${record.name}`, action: 'delete' }}
                  project={record.project.name}
                >
                  <a
                    onClick={() => {
                      Dialog.confirm({
                        type: 'confirm',
                        content: (
                          <Translation>
                            Unrecoverable after deletion, are you sure to delete it?
                          </Translation>
                        ),
                        onOk: () => {
                          this.onDelete(record);
                        },
                        locale: locale().Dialog,
                      });
                    }}
                  >
                    <Translation>Remove</Translation>
                  </a>
                </Permission>
                <Permission
                  request={{ resource: `environment:${record.name}`, action: 'update' }}
                  project={record.project.name}
                >
                  <a
                    className="margin-left-10"
                    onClick={() => {
                      this.onEdit(record);
                    }}
                  >
                    <Translation>Edit</Translation>
                  </a>
                </Permission>
              </If>
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { Column } = Table;
    const columns = this.getColumns();
    const { list } = this.props;
    return (
      <div className="table-delivery-list margin-top-20">
        <Table
          locale={locale().Table}
          className="customTable"
          size="medium"
          dataSource={list}
          hasBorder={false}
          loading={false}
        >
          {columns && columns.map((col) => <Column {...col} key={col.key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default TableList;
