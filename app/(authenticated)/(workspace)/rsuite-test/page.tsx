'use client';

import { useState } from 'react';
import {
  Button,
  ButtonToolbar,
  ButtonGroup,
  Input,
  InputGroup,
  SelectPicker,
  NumberInput,
  DatePicker,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Toggle,
  Slider,
  Tag,
  TagGroup,
  Badge,
  Avatar,
  Progress,
  Tooltip,
  Whisper,
  Message,
  Modal,
  Drawer,
} from 'rsuite';

const fruitOptions = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
].map((o) => ({ ...o, role: 'option' as const }));

export default function RsuiteTestPage() {
  const [fruit, setFruit] = useState<string | null>(null);
  const [number, setNumber] = useState(42);
  const [date, setDate] = useState<Date | null>(new Date());
  const [toggleOn, setToggleOn] = useState(true);
  const [checkboxValues, setCheckboxValues] = useState<string[]>(['email']);
  const [radioValue, setRadioValue] = useState('medium');
  const [sliderValue, setSliderValue] = useState(50);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [textInput, setTextInput] = useState('');

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 0' }}>
      <h1 style={{ marginBottom: 4 }}>RSuite Theme Test</h1>
      <p className="muted" style={{ marginBottom: 32 }}>
        All components below should follow the Vitalix earthy palette.
      </p>

      {/* Buttons */}
      <Section title="Buttons">
        <ButtonToolbar>
          <Button appearance="primary">Primary</Button>
          <Button appearance="default">Default</Button>
          <Button appearance="subtle">Subtle</Button>
          <Button appearance="ghost">Ghost</Button>
          <Button appearance="link">Link</Button>
        </ButtonToolbar>
        <ButtonToolbar style={{ marginTop: 12 }}>
          <Button appearance="primary" color="red">
            Red
          </Button>
          <Button appearance="primary" color="orange">
            Orange
          </Button>
          <Button appearance="primary" color="yellow">
            Yellow
          </Button>
          <Button appearance="primary" color="green">
            Green
          </Button>
          <Button appearance="primary" color="cyan">
            Cyan
          </Button>
          <Button appearance="primary" color="blue">
            Blue
          </Button>
          <Button appearance="primary" color="violet">
            Violet
          </Button>
        </ButtonToolbar>
        <ButtonToolbar style={{ marginTop: 12 }}>
          <Button appearance="primary" size="lg">
            Large
          </Button>
          <Button appearance="primary" size="md">
            Medium
          </Button>
          <Button appearance="primary" size="sm">
            Small
          </Button>
          <Button appearance="primary" size="xs">
            X-Small
          </Button>
        </ButtonToolbar>
        <ButtonGroup style={{ marginTop: 12 }}>
          <Button appearance="primary">Save</Button>
          <Button appearance="primary">Edit</Button>
          <Button appearance="primary">Delete</Button>
        </ButtonGroup>
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
          <div>
            <Label>Text Input</Label>
            <Input placeholder="Type something..." value={textInput} onChange={setTextInput} />
          </div>
          <div>
            <Label>Input with addon</Label>
            <InputGroup>
              <InputGroup.Addon>@</InputGroup.Addon>
              <Input placeholder="Username" />
            </InputGroup>
          </div>
          <div>
            <Label>Disabled Input</Label>
            <Input disabled value="Cannot edit this" />
          </div>
        </div>
      </Section>
      {/* SelectPicker */}
      <Section title="SelectPicker">
        <div style={{ maxWidth: 300 }}>
          <SelectPicker
            data={fruitOptions}
            value={fruit}
            onChange={setFruit}
            placeholder="Pick a fruit..."
            searchable
            style={{ width: '100%' }}
          />
          {fruit && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
              Selected: <strong>{fruit}</strong>
            </p>
          )}
        </div>
      </Section>

      {/* NumberInput */}
      <Section title="NumberInput">
        <div style={{ maxWidth: 200 }}>
          <NumberInput
            value={number}
            onChange={(v) => setNumber(Number(v))}
            step={5}
            min={0}
            max={100}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>Value: {number}</p>
        </div>
      </Section>

      {/* DatePicker */}
      <Section title="DatePicker">
        <div style={{ maxWidth: 260 }}>
          <DatePicker
            value={date}
            onChange={setDate}
            format="yyyy-MM-dd"
            style={{ width: '100%' }}
          />
        </div>
      </Section>

      {/* Toggle, Slider, Checkbox, Radio */}
      <Section title="Toggle · Slider · Checkbox · Radio">
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle checked={toggleOn} onChange={setToggleOn} />
            <span style={{ fontSize: 13 }}>{toggleOn ? 'On' : 'Off'}</span>
          </div>
          <div style={{ maxWidth: 260 }}>
            <p style={{ fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Slider: {sliderValue}</p>
            <Slider value={sliderValue} onChange={setSliderValue} />
          </div>
          <div>
            <p style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Checkbox Group</p>
            <CheckboxGroup
              name="notify"
              value={checkboxValues}
              onChange={(v) => setCheckboxValues(v as string[])}
            >
              <Checkbox value="email">Email</Checkbox>
              <Checkbox value="sms">SMS</Checkbox>
              <Checkbox value="push">Push notification</Checkbox>
            </CheckboxGroup>
          </div>
          <div>
            <p style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Radio Group</p>
            <RadioGroup
              name="priority"
              value={radioValue}
              onChange={(v) => setRadioValue(v as string)}
            >
              <Radio value="low">Low</Radio>
              <Radio value="medium">Medium</Radio>
              <Radio value="high">High</Radio>
            </RadioGroup>
          </div>
        </div>
      </Section>

      {/* Progress */}
      <Section title="Progress">
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <Progress.Line percent={75} strokeColor="var(--rs-primary-500)" style={{ width: 200 }} />
          <Progress.Circle percent={60} strokeColor="var(--rs-primary-500)" />
        </div>
      </Section>

      {/* Badges & Tags */}
      <Section title="Badges &amp; Tags">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge content={3}>
            <Avatar circle style={{ background: 'var(--rs-primary-500)' }}>
              AB
            </Avatar>
          </Badge>
          <TagGroup>
            <Tag color="green">Active</Tag>
            <Tag color="red">Error</Tag>
            <Tag color="orange">Warning</Tag>
            <Tag color="blue">Info</Tag>
            <Tag color="violet">Beta</Tag>
          </TagGroup>
          <Avatar circle style={{ background: 'var(--rs-green-500)', color: '#fff' }}>
            V2
          </Avatar>
        </div>
      </Section>

      {/* Messages */}
      <Section title="Messages (Status)">
        <div style={{ display: 'grid', gap: 12 }}>
          <Message type="success" showIcon>
            Measurement logged successfully.
          </Message>
          <Message type="info" showIcon>
            Your next checkup is in 3 months.
          </Message>
          <Message type="warning" showIcon>
            Medication refill due soon.
          </Message>
          <Message type="error" showIcon>
            Unable to sync data. Please try again.
          </Message>
        </div>
      </Section>

      {/* Tooltips */}
      <Section title="Tooltips">
        <div style={{ display: 'flex', gap: 12 }}>
          <Whisper speaker={<Tooltip>This is a primary button</Tooltip>} placement="top">
            <Button appearance="primary">Hover me</Button>
          </Whisper>
          <Whisper speaker={<Tooltip>Subtle action</Tooltip>} placement="top">
            <Button appearance="subtle">Hover me</Button>
          </Whisper>
        </div>
      </Section>
      {/* Modals & Drawers */}
      <Section title="Modals &amp; Drawers">
        <ButtonToolbar>
          <Button appearance="primary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
          <Button appearance="subtle" onClick={() => setDrawerOpen(true)}>
            Open Drawer
          </Button>
        </ButtonToolbar>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Modal.Header>
            <Modal.Title>Confirm Action</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to proceed? This action cannot be undone.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button appearance="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
            <Button appearance="subtle" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Drawer.Header>
            <Drawer.Title>Health Details</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
              This drawer uses your theme — warm cream background, earthy borders.
            </p>
            <div style={{ marginTop: 16 }}>
              <SelectPicker
                data={fruitOptions}
                placeholder="Pick a fruit..."
                style={{ width: 200 }}
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button appearance="primary" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </Drawer.Footer>
        </Drawer>
      </Section>

      <footer style={{ marginTop: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 11 }}>
        /rsuite-test — theme verification page
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 36,
        padding: 24,
        background: 'var(--rs-bg-card)',
        border: '1px solid var(--rs-border-primary)',
        borderRadius: 'var(--rs-radius-lg)',
      }}
    >
      <h2
        style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid var(--rs-border-primary)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
      {children}
    </label>
  );
}
