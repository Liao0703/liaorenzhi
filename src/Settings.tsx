import React, { useEffect, useState } from 'react';
import { userAPI } from './config/api';
import { JOB_TYPES, UNITS, DEPARTMENTS, TEAMS } from './config/jobTypes';

interface SettingsProps {
  user: any;
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 14,
  background: '#fff',
  color: '#111827',
  boxShadow: '0 1px 2px rgba(16,24,40,0.05)'
};

const buttonPrimary: React.CSSProperties = {
  padding: '10px 14px',
  background: 'linear-gradient(90deg,#3b82f6 0%, #2563eb 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #eef2f7',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 4px 12px rgba(15,23,42,0.04)'
};

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [profile, setProfile] = useState({
    avatar: user?.avatar || '',
    nickname: user?.name || user?.nickname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    team: user?.team || '',
    job_type: user?.job_type || '',
  });
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const [email2FAEnabled, setEmail2FAEnabled] = useState<boolean>(!!user?.two_factor_email_enabled);
  const [emailCode, setEmailCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);

  useEffect(() => {
    setEmail2FAEnabled(!!user?.two_factor_email_enabled);
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateMe(profile);
      if (!res.success) alert(res.error || '更新失败');
      else alert('已保存');
    } catch (e) {
      console.error(e);
      alert('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword) return alert('请输入原密码和新密码');
    setChangingPwd(true);
    try {
      const res = await userAPI.changePassword(oldPassword, newPassword);
      if (!res.success) alert(res.error || '修改失败');
      else {
        alert('密码已修改');
        setOldPassword('');
        setNewPassword('');
      }
    } catch (e) {
      console.error(e);
      alert('网络错误');
    } finally {
      setChangingPwd(false);
    }
  };

  const sendEmailCode = async () => {
    setSendingCode(true);
    try {
      const res = await userAPI.sendEmail2FACode();
      if (!res.success) alert(res.error || '发送失败');
      else alert('验证码已发送至邮箱');
    } catch (e) {
      console.error(e);
      alert('网络错误');
    } finally {
      setSendingCode(false);
    }
  };

  const toggleEmail2FA = async (enable: boolean) => {
    if (!emailCode) return alert('请输入邮箱验证码');
    setToggling2FA(true);
    try {
      const res = enable ? await userAPI.enableEmail2FA(emailCode) : await userAPI.disableEmail2FA(emailCode);
      if (!res.success) alert(res.error || '操作失败');
      else {
        alert(enable ? '已开启邮箱两步验证' : '已关闭邮箱两步验证');
        setEmail2FAEnabled(enable);
        setEmailCode('');
      }
    } catch (e) {
      console.error(e);
      alert('网络错误');
    } finally {
      setToggling2FA(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 16px 0' }}>个人设置</h2>

      {/* 资料卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>基本资料</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: 16 }}>
            <div style={fieldStyle}>
              <label>头像URL</label>
              <input style={inputStyle} placeholder="https://..." value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <img src={profile.avatar || 'https://avatars.githubusercontent.com/u/9919?v=4'} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid #e5e7eb' }} />
            </div>
            <div style={fieldStyle}>
              <label>昵称</label>
              <input style={inputStyle} value={profile.nickname} onChange={e => setProfile(p => ({ ...p, nickname: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label>邮箱</label>
              <input style={inputStyle} type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label>手机号</label>
              <input style={inputStyle} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div style={fieldStyle}>
              <label>部门</label>
              <select
                value={profile.department}
                onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
                style={{ ...inputStyle, maxWidth: 360 }}
              >
                <option value="">请选择部门</option>
                {DEPARTMENTS.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label>班组</label>
              <select
                value={profile.team}
                onChange={e => setProfile(p => ({ ...p, team: e.target.value }))}
                style={{ ...inputStyle, maxWidth: 360 }}
              >
                <option value="">请选择班组</option>
                {TEAMS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label>岗位/工种</label>
              <select
                value={profile.job_type}
                onChange={e => setProfile(p => ({ ...p, job_type: e.target.value }))}
                style={{ ...inputStyle, maxWidth: 360 }}
              >
                <option value="">请选择工种</option>
                {JOB_TYPES.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button style={buttonPrimary} disabled={saving} onClick={saveProfile}>{saving ? '保存中...' : '保存资料'}</button>
          </div>
        </div>

        {/* 修改密码 */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>修改密码</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))', gap: 16, alignItems: 'end' }}>
            <div style={fieldStyle}>
              <label>原密码</label>
              <input style={inputStyle} type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label>新密码</label>
              <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button style={buttonPrimary} disabled={changingPwd} onClick={changePassword}>{changingPwd ? '提交中...' : '确认修改'}</button>
          </div>
        </div>

        {/* 邮箱两步验证 */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>邮箱两步验证</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span>当前状态：</span>
            <span style={{ fontWeight: 700, color: email2FAEnabled ? '#16a34a' : '#6b7280' }}>{email2FAEnabled ? '已开启' : '未开启'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 120px 120px', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <button style={{ ...buttonPrimary, background: '#111827' }} disabled={sendingCode} onClick={sendEmailCode}>{sendingCode ? '发送中...' : '发送邮箱验证码'}</button>
            <input style={{ ...inputStyle }} placeholder="6位验证码" value={emailCode} onChange={e => setEmailCode(e.target.value)} />
            <button style={buttonPrimary} disabled={toggling2FA} onClick={() => toggleEmail2FA(true)}>{toggling2FA ? '处理中...' : '开启'}</button>
            <button style={{ ...buttonPrimary, background: '#ef4444' }} disabled={toggling2FA} onClick={() => toggleEmail2FA(false)}>{toggling2FA ? '处理中...' : '关闭'}</button>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>为确保账号安全，建议开启两步验证。开启后，登录或关键操作需校验邮箱验证码。</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


